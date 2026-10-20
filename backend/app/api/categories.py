from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryOut])
def list_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve all categories available to the user (system defaults + user custom)."""
    categories = db.query(Category).filter(
        or_(Category.is_system == True, Category.user_id == current_user.id)
    ).order_by(Category.is_system.desc(), Category.name.asc()).all()
    return categories


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Create a new custom category for the authenticated user."""
    # Check if category with this name already exists for user or system
    existing = db.query(Category).filter(
        Category.name.ilike(cat_in.name.strip()),
        or_(Category.is_system == True, Category.user_id == current_user.id)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A category named '{cat_in.name}' already exists."
        )

    cat = Category(
        user_id=current_user.id,
        name=cat_in.name.strip(),
        type=cat_in.type,
        color=cat_in.color or "#10B981",
        icon=cat_in.icon or "tag",
        is_system=False
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    cat_update: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update a custom category (system categories cannot be edited)."""
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    if cat.is_system or cat.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot modify system or another user's categories")

    if cat_update.name is not None:
        cat.name = cat_update.name.strip()
    if cat_update.type is not None:
        cat.type = cat_update.type
    if cat_update.color is not None:
        cat.color = cat_update.color
    if cat_update.icon is not None:
        cat.icon = cat_update.icon

    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
def delete_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Delete a custom category (system categories cannot be deleted)."""
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    if cat.is_system or cat.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete system or another user's categories")

    db.delete(cat)
    db.commit()
    return {"message": "Category deleted successfully"}
