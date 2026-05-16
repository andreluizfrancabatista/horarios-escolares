from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.usuario import Usuario
from app.core.security import verify_password, create_access_token
from app.schemas.schemas import Token

router = APIRouter()


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
        )
    if not user.ativo:
        raise HTTPException(status_code=400, detail="Usuário inativo")

    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "nome": user.nome}
