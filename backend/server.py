from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'shopping-list-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer(auto_error=False)

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class ShoppingListCreate(BaseModel):
    name: str

class ShoppingListUpdate(BaseModel):
    name: Optional[str] = None

class ShoppingList(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    name: str
    created_at: datetime
    updated_at: datetime

class ItemCreate(BaseModel):
    name: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    note: Optional[str] = None
    priority: Optional[int] = None

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    note: Optional[str] = None
    is_done: Optional[bool] = None
    priority: Optional[int] = None
    order: Optional[int] = None

class Item(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    list_id: str
    name: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    note: Optional[str] = None
    is_done: bool = False
    priority: Optional[int] = None
    order: int = 0
    created_at: datetime
    updated_at: datetime

class ExportData(BaseModel):
    lists: List[dict]
    items: List[dict]
    exported_at: datetime

class ImportData(BaseModel):
    lists: List[dict]
    items: List[dict]

class SyncRequest(BaseModel):
    lists: List[dict]
    items: List[dict]
    last_sync: Optional[str] = None

# ============ HELPER FUNCTIONS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    if session_token:
        # Google OAuth session
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            expires_at = session.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    return user
    
    # Check Authorization header (JWT)
    if credentials:
        token = credentials.credentials
        payload = decode_jwt_token(token)
        user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
        if user:
            return user
    
    raise HTTPException(status_code=401, detail="Not authenticated")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مسجل مسبقاً")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_password = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hashed_password,
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_jwt_token(user_id, user_data.email)
    
    return {
        "token": token,
        "user": {
            "user_id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "picture": None
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    
    if not user.get("password"):
        raise HTTPException(status_code=401, detail="يرجى استخدام تسجيل الدخول عبر Google")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    
    token = create_jwt_token(user["user_id"], user["email"])
    
    return {
        "token": token,
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "picture": user.get("picture")
        }
    }

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange Google OAuth session_id for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent Auth to get session data
    async with httpx.AsyncClient() as client_http:
        auth_response = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        session_data = auth_response.json()
    
    email = session_data.get("email")
    name = session_data.get("name")
    picture = session_data.get("picture")
    session_token = session_data.get("session_token")
    
    # Find or create user
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture")
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============ SHOPPING LIST ROUTES ============

@api_router.get("/lists", response_model=List[ShoppingList])
async def get_lists(user: dict = Depends(get_current_user)):
    lists = await db.shopping_lists.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(100)
    
    for lst in lists:
        if isinstance(lst.get('created_at'), str):
            lst['created_at'] = datetime.fromisoformat(lst['created_at'])
        if isinstance(lst.get('updated_at'), str):
            lst['updated_at'] = datetime.fromisoformat(lst['updated_at'])
    
    return lists

@api_router.post("/lists", response_model=ShoppingList)
async def create_list(list_data: ShoppingListCreate, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    list_id = f"list_{uuid.uuid4().hex[:12]}"
    
    list_doc = {
        "id": list_id,
        "user_id": user["user_id"],
        "name": list_data.name,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.shopping_lists.insert_one(list_doc)
    
    list_doc['created_at'] = now
    list_doc['updated_at'] = now
    
    return ShoppingList(**list_doc)

@api_router.get("/lists/{list_id}", response_model=ShoppingList)
async def get_list(list_id: str, user: dict = Depends(get_current_user)):
    lst = await db.shopping_lists.find_one(
        {"id": list_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not lst:
        raise HTTPException(status_code=404, detail="القائمة غير موجودة")
    
    if isinstance(lst.get('created_at'), str):
        lst['created_at'] = datetime.fromisoformat(lst['created_at'])
    if isinstance(lst.get('updated_at'), str):
        lst['updated_at'] = datetime.fromisoformat(lst['updated_at'])
    
    return ShoppingList(**lst)

@api_router.put("/lists/{list_id}", response_model=ShoppingList)
async def update_list(list_id: str, list_data: ShoppingListUpdate, user: dict = Depends(get_current_user)):
    lst = await db.shopping_lists.find_one(
        {"id": list_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not lst:
        raise HTTPException(status_code=404, detail="القائمة غير موجودة")
    
    update_data = {}
    if list_data.name is not None:
        update_data["name"] = list_data.name
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.shopping_lists.update_one(
        {"id": list_id},
        {"$set": update_data}
    )
    
    updated = await db.shopping_lists.find_one({"id": list_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return ShoppingList(**updated)

@api_router.delete("/lists/{list_id}")
async def delete_list(list_id: str, user: dict = Depends(get_current_user)):
    lst = await db.shopping_lists.find_one(
        {"id": list_id, "user_id": user["user_id"]}
    )
    
    if not lst:
        raise HTTPException(status_code=404, detail="القائمة غير موجودة")
    
    # Delete all items in the list
    await db.items.delete_many({"list_id": list_id})
    # Delete the list
    await db.shopping_lists.delete_one({"id": list_id})
    
    return {"message": "تم حذف القائمة بنجاح"}

# ============ ITEM ROUTES ============

@api_router.get("/lists/{list_id}/items", response_model=List[Item])
async def get_items(list_id: str, user: dict = Depends(get_current_user)):
    # Verify list ownership
    lst = await db.shopping_lists.find_one(
        {"id": list_id, "user_id": user["user_id"]}
    )
    if not lst:
        raise HTTPException(status_code=404, detail="القائمة غير موجودة")
    
    items = await db.items.find({"list_id": list_id}, {"_id": 0}).sort("order", 1).to_list(500)
    
    for item in items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        if isinstance(item.get('updated_at'), str):
            item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    
    return items

@api_router.post("/lists/{list_id}/items", response_model=Item)
async def create_item(list_id: str, item_data: ItemCreate, user: dict = Depends(get_current_user)):
    # Verify list ownership
    lst = await db.shopping_lists.find_one(
        {"id": list_id, "user_id": user["user_id"]}
    )
    if not lst:
        raise HTTPException(status_code=404, detail="القائمة غير موجودة")
    
    # Get max order
    max_order_item = await db.items.find_one(
        {"list_id": list_id},
        sort=[("order", -1)]
    )
    next_order = (max_order_item.get("order", 0) + 1) if max_order_item else 0
    
    now = datetime.now(timezone.utc)
    item_id = f"item_{uuid.uuid4().hex[:12]}"
    
    item_doc = {
        "id": item_id,
        "list_id": list_id,
        "name": item_data.name,
        "quantity": item_data.quantity,
        "unit": item_data.unit,
        "category": item_data.category,
        "note": item_data.note,
        "is_done": False,
        "priority": item_data.priority,
        "order": next_order,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.items.insert_one(item_doc)
    
    # Update list timestamp
    await db.shopping_lists.update_one(
        {"id": list_id},
        {"$set": {"updated_at": now.isoformat()}}
    )
    
    item_doc['created_at'] = now
    item_doc['updated_at'] = now
    
    return Item(**item_doc)

@api_router.put("/lists/{list_id}/items/{item_id}", response_model=Item)
async def update_item(list_id: str, item_id: str, item_data: ItemUpdate, user: dict = Depends(get_current_user)):
    # Verify list ownership
    lst = await db.shopping_lists.find_one(
        {"id": list_id, "user_id": user["user_id"]}
    )
    if not lst:
        raise HTTPException(status_code=404, detail="القائمة غير موجودة")
    
    item = await db.items.find_one({"id": item_id, "list_id": list_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="العنصر غير موجود")
    
    update_data = {}
    for field in ['name', 'quantity', 'unit', 'category', 'note', 'is_done', 'priority', 'order']:
        value = getattr(item_data, field, None)
        if value is not None:
            update_data[field] = value
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.items.update_one({"id": item_id}, {"$set": update_data})
    
    # Update list timestamp
    await db.shopping_lists.update_one(
        {"id": list_id},
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    updated = await db.items.find_one({"id": item_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return Item(**updated)

@api_router.delete("/lists/{list_id}/items/{item_id}")
async def delete_item(list_id: str, item_id: str, user: dict = Depends(get_current_user)):
    # Verify list ownership
    lst = await db.shopping_lists.find_one(
        {"id": list_id, "user_id": user["user_id"]}
    )
    if not lst:
        raise HTTPException(status_code=404, detail="القائمة غير موجودة")
    
    result = await db.items.delete_one({"id": item_id, "list_id": list_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="العنصر غير موجود")
    
    # Update list timestamp
    await db.shopping_lists.update_one(
        {"id": list_id},
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "تم حذف العنصر بنجاح"}

# ============ BULK ACTIONS ============

@api_router.post("/lists/{list_id}/mark-all-done")
async def mark_all_done(list_id: str, user: dict = Depends(get_current_user)):
    lst = await db.shopping_lists.find_one(
        {"id": list_id, "user_id": user["user_id"]}
    )
    if not lst:
        raise HTTPException(status_code=404, detail="القائمة غير موجودة")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.items.update_many(
        {"list_id": list_id},
        {"$set": {"is_done": True, "updated_at": now}}
    )
    
    await db.shopping_lists.update_one(
        {"id": list_id},
        {"$set": {"updated_at": now}}
    )
    
    return {"message": "تم تحديد جميع العناصر كمشتراة"}

@api_router.post("/lists/{list_id}/clear-done")
async def clear_done(list_id: str, user: dict = Depends(get_current_user)):
    lst = await db.shopping_lists.find_one(
        {"id": list_id, "user_id": user["user_id"]}
    )
    if not lst:
        raise HTTPException(status_code=404, detail="القائمة غير موجودة")
    
    await db.items.delete_many({"list_id": list_id, "is_done": True})
    
    await db.shopping_lists.update_one(
        {"id": list_id},
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "تم مسح العناصر المشتراة"}

# ============ EXPORT/IMPORT ============

@api_router.get("/export")
async def export_data(user: dict = Depends(get_current_user)):
    lists = await db.shopping_lists.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    
    list_ids = [lst["id"] for lst in lists]
    items = await db.items.find(
        {"list_id": {"$in": list_ids}},
        {"_id": 0}
    ).to_list(1000)
    
    return {
        "lists": lists,
        "items": items,
        "exported_at": datetime.now(timezone.utc).isoformat()
    }

@api_router.post("/import")
async def import_data(data: ImportData, user: dict = Depends(get_current_user)):
    # Map old IDs to new IDs
    list_id_map = {}
    
    for lst in data.lists:
        old_id = lst.get("id")
        new_id = f"list_{uuid.uuid4().hex[:12]}"
        list_id_map[old_id] = new_id
        
        now = datetime.now(timezone.utc)
        list_doc = {
            "id": new_id,
            "user_id": user["user_id"],
            "name": lst.get("name", "Imported List"),
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        await db.shopping_lists.insert_one(list_doc)
    
    for item in data.items:
        old_list_id = item.get("list_id")
        new_list_id = list_id_map.get(old_list_id)
        
        if new_list_id:
            now = datetime.now(timezone.utc)
            item_doc = {
                "id": f"item_{uuid.uuid4().hex[:12]}",
                "list_id": new_list_id,
                "name": item.get("name", ""),
                "quantity": item.get("quantity"),
                "unit": item.get("unit"),
                "category": item.get("category"),
                "note": item.get("note"),
                "is_done": item.get("is_done", False),
                "priority": item.get("priority"),
                "order": item.get("order", 0),
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
            await db.items.insert_one(item_doc)
    
    return {"message": "تم استيراد البيانات بنجاح", "lists_imported": len(data.lists)}

# ============ SYNC ============

@api_router.post("/sync")
async def sync_data(sync_request: SyncRequest, user: dict = Depends(get_current_user)):
    """Sync offline changes with server (last write wins)"""
    synced_lists = []
    synced_items = []
    
    for lst in sync_request.lists:
        existing = await db.shopping_lists.find_one(
            {"id": lst.get("id"), "user_id": user["user_id"]},
            {"_id": 0}
        )
        
        if existing:
            # Update if client version is newer
            await db.shopping_lists.update_one(
                {"id": lst["id"]},
                {"$set": {
                    "name": lst.get("name", existing.get("name")),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        else:
            # Create new
            now = datetime.now(timezone.utc)
            list_doc = {
                "id": lst.get("id", f"list_{uuid.uuid4().hex[:12]}"),
                "user_id": user["user_id"],
                "name": lst.get("name", "Synced List"),
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
            await db.shopping_lists.insert_one(list_doc)
        
        synced_lists.append(lst.get("id"))
    
    for item in sync_request.items:
        existing = await db.items.find_one({"id": item.get("id")}, {"_id": 0})
        
        if existing:
            # Update
            await db.items.update_one(
                {"id": item["id"]},
                {"$set": {
                    "name": item.get("name", existing.get("name")),
                    "quantity": item.get("quantity"),
                    "unit": item.get("unit"),
                    "category": item.get("category"),
                    "note": item.get("note"),
                    "is_done": item.get("is_done", False),
                    "priority": item.get("priority"),
                    "order": item.get("order", 0),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        else:
            # Create new
            now = datetime.now(timezone.utc)
            item_doc = {
                "id": item.get("id", f"item_{uuid.uuid4().hex[:12]}"),
                "list_id": item.get("list_id"),
                "name": item.get("name", ""),
                "quantity": item.get("quantity"),
                "unit": item.get("unit"),
                "category": item.get("category"),
                "note": item.get("note"),
                "is_done": item.get("is_done", False),
                "priority": item.get("priority"),
                "order": item.get("order", 0),
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
            await db.items.insert_one(item_doc)
        
        synced_items.append(item.get("id"))
    
    # Get all current data to return to client
    all_lists = await db.shopping_lists.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    
    list_ids = [lst["id"] for lst in all_lists]
    all_items = await db.items.find(
        {"list_id": {"$in": list_ids}},
        {"_id": 0}
    ).to_list(1000)
    
    return {
        "lists": all_lists,
        "items": all_items,
        "synced_at": datetime.now(timezone.utc).isoformat()
    }

# ============ ROOT ============

@api_router.get("/")
async def root():
    return {"message": "Shopping List API", "status": "ok"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
