from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import Customer
from app.schemas import CustomerCreate, CustomerRead

router = APIRouter()

@router.post("/", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def create_customer(customer_in: CustomerCreate, db: Session = Depends(get_session)):
    # Check if exists
    statement = select(Customer).where(Customer.name == customer_in.name)
    existing = db.exec(statement).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer with this name already exists"
        )
    
    db_customer = Customer(name=customer_in.name)
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("/", response_model=List[CustomerRead])
def read_customers(db: Session = Depends(get_session)):
    statement = select(Customer)
    return db.exec(statement).all()
