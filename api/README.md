API for local MySQL integration

1. Setup

- Copy `.env.example` to `.env` and set your MySQL credentials.
- From project root run:

```bash
cd api
npm install
```

2. Create the database and tables

- In MySQL Workbench run `api/migrations/mysql_create_tables.sql` against your MySQL server.

3. Run the API server

```bash
npm run dev
```

This server exposes:
- `GET /api/social-links`
- `POST /api/social-links`
- `PUT /api/social-links/:id`
- `DELETE /api/social-links/:id`
- `GET /api/flowers`
- `POST /api/upload` (multipart/form-data file field `file`)
- `POST /api/flowers`
- `PUT /api/flowers/:id`
- `DELETE /api/flowers/:id`

Uploaded files are saved to `public/uploads` and served at `/uploads/<filename>`.
