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

# --- MINES state ---
mines_game = None


class AmountRequest(BaseModel):
    amount: float


class SelectRequest(BaseModel):
    index: int


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


@app.get("/mines")
def mines_page(request: Request):
    return templates.TemplateResponse("mines.html", {"request": request})


@app.post("/mines/start")
def start_mines(data: AmountRequest):
    global mines_game
    if data.amount <= 0 or data.amount > user.balance:
        raise HTTPException(status_code=400, detail="Invalid bet")
    user.balance -= data.amount
    mines_game = {
        "bet": data.amount,
        "mines": random.sample(range(25), 5),
        "revealed": [],
        "game_over": False,
        "win_amount": 0.0
    }
    return mines_game


@app.post("/mines/select")
def select_cell(req: SelectRequest):
    global mines_game
    if not mines_game or mines_game["game_over"]:
        raise HTTPException(status_code=400, detail="Game not active")
    index = req.index
    if index in mines_game["revealed"]:
        raise HTTPException(status_code=400, detail="Cell already revealed")
    if index in mines_game["mines"]:
        mines_game["game_over"] = True
        mines_game["win_amount"] = 0
    else:
        mines_game["revealed"].append(index)
        mines_game["win_amount"] = len(mines_game["revealed"]) * 0.5 * mines_game["bet"]
    return mines_game


@app.post("/mines/cashout")
def cashout():
    global mines_game
    if not mines_game or mines_game["game_over"]:
        raise HTTPException(status_code=400, detail="Nothing to cash out")
    win = mines_game["win_amount"]
    user.balance += win
    mines_game = None
    return {"win_amount": win}


def calculate_slot_win(slots, amount):
    if slots.count(slots[0]) == 3:
        return amount * 5
    elif len(set(slots)) == 2:
        return amount * 2
    return 0
