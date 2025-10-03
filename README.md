# User Service

REST API для управления пользователями с авторизацией и ролями (админ и обычный пользователь).  
Проект построен на Node.js, Express и Sequelize с SQLite базой данных.


### Стек технологий:

- Node.js
- Express
- Sequelize ORM
- SQLite
- bcrypt (хеширование паролей)
- JSON Web Token (JWT) для авторизации


### Установка и запуск

1. Клонируем репозиторий:

```bash
git clone <URL_репозитория>
cd user-service
```

2. Устанавливаем зависимости:

```bash
npm install
```

3. Запускаем сервер:

```bash
node index.js
```

По умолчанию сервер будет работать на http://localhost:3000.

---

### Авторизация и регистрация

Регистрация пользователя:

```http
POST /register
Content-Type: application/json

{
  "fullName": "Имя Фамилия",
  "birthDate": "YYYY-MM-DD",
  "email": "user@example.com",
  "password": "пароль",
  "role": "user"   # "admin" или "user" (по умолчанию "user")
}
```

Логин:

```http
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "пароль"
}
```

Ответ:

```http
{
  "token": "<JWT>"
}
```
---

### Работа с пользователями

Все запросы к /users требуют JWT в заголовке:

```makefile
Authorization: Bearer <JWT>
```

Получить конкретного пользователя:

```http
GET /users/:id
```

Получить всех пользователей (только для админа):

```http
GET /users
```

Заблокировать пользователя (админ или сам пользователь):

```http
POST /users/:id/block
```

Удалить всех пользователей (только админ):

```http
DELETE /users
```
---

### Примеры curl

Регистрация:

```bash
curl -X POST http://localhost:3000/register \
-H "Content-Type: application/json" \
-d '{
  "fullName": "Админ Админов",
  "birthDate": "1990-01-01",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}'
```

Логин:

```http
curl -X POST http://localhost:3000/login \
-H "Content-Type: application/json" \
-d '{
  "email": "admin@example.com",
  "password": "admin123"
}'
```

Получить всех пользователей:

```http
curl -X GET http://localhost:3000/users \
-H "Authorization: Bearer <JWT_админа>"
```

Заблокировать пользователя:

```http
curl -X POST http://localhost:3000/users/2/block \
-H "Authorization: Bearer <JWT_админа>"
```
---

### Тестирование

Используйте Postman, Insomnia или curl. Сначала зарегистрируйте пользователей и админа. Получите токен через `/login`. Используйте токен в Authorization для доступа к защищённым эндпоинтам.

Проверяйте поведение при:

- Доступе обычного пользователя к `/users` → `Forbidden`

- Доступе админа к `/users` → список всех пользователей

- Блокировке пользователя (статус `false`)

### Особенности

- JWT авторизация с ролями (`admin` / `user`)

- Пользователь может заблокировать себя, админ может блокировать любого

- SQLite база (файл users.db)

- Хеширование паролей через bcrypt

- Простая структура для быстрого старта и тестирования

### Сброс счётчика пользователей

При разработке иногда нужно полностью очистить базу и сбросить счётчик `id`. Для этого можно пересоздать таблицу через Sequelize:

```js
sequelize.sync({ force: true }).then(() => {
    app.listen(3000, () => console.log("Server running on http://localhost:3000"));
});
```
