from app.db.session import SessionLocal
from app.models.usuario import Usuario
from app.core.security import get_password_hash
from app.core.config import settings


def init_db():
    db = SessionLocal()
    try:
        user = db.query(Usuario).filter(Usuario.email == settings.FIRST_ADMIN_EMAIL).first()
        if not user:
            admin = Usuario(
                nome="Administrador",
                email=settings.FIRST_ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.FIRST_ADMIN_PASSWORD),
                ativo=True,
            )
            db.add(admin)
            db.commit()
            print(f"✅ Admin criado: {settings.FIRST_ADMIN_EMAIL}")
    finally:
        db.close()
