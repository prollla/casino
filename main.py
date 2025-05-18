from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import List
from datetime import datetime
import random

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


class Bet(BaseModel):
    id: int
    amount: float
    result: str
    win_amount: float
    created_at: datetime


class User(BaseModel):
    balance: float
    bets: List[Bet]


user = User(balance=100.0, bets=[])
bet_counter = 1


class AmountRequest(BaseModel):
    amount: float


@app.get("/")
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/balance")
def get_balance():
    return {"balance": user.balance}


@app.post("/deposit")
def deposit(data: AmountRequest):
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    user.balance += data.amount
    return {"message": f"Deposited {data.amount}", "new_balance": user.balance}


@app.post("/bet")
def make_bet(data: AmountRequest):
    global bet_counter
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    if data.amount > user.balance:
        raise HTTPException(status_code=400, detail="Not enough balance")

    slots = [random.choice(["🍒", "🍋", "🍊", "⭐", "💎", "💵"]) for _ in range(3)]
    win = calculate_slot_win(slots, data.amount)
    user.balance += win - data.amount

    bet = Bet(
        id=bet_counter,
        amount=data.amount,
        result="".join(slots),
        win_amount=win,
        created_at=datetime.utcnow()
    )
    bet_counter += 1
    user.bets.append(bet)

    return {
        "slots": slots,
        "win_amount": win,
        "new_balance": user.balance
    }


@app.get("/bets")
def get_bets():
    return user.bets


def calculate_slot_win(slots, amount):
    if slots.count(slots[0]) == 3:
        return amount * 5
    elif len(set(slots)) == 2:
        return amount * 2
    return 0
