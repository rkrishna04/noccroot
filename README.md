# N-DAMS

## Setup and Local Run (Vercel)

1. Install dependencies:
   - `npm install`
2. Configure environment:
   - set `DATABASE_URL` to your PostgreSQL connection
   - set `JWT_SECRET` (optional, but recommended)
3. Prisma scaffolding:
   - `npx prisma generate`
   - `npx prisma migrate dev --name init`
4. Run locally:
   - `npm run dev`

## Endpoints (serverless)

- `POST /api/auth/register` (fullName, email, password, role)
- `POST /api/auth/login` (email, password)
- `GET /api/users`
- `POST /api/users` (fullName, email, password, role)
- `GET /api/modules`
- `POST /api/modules` (name, tableName, path, roleNames)
- `GET /api/data/[module]`
- `POST /api/data/[module]` (data)
- `PUT /api/data/[module]?id=<id>`
- `DELETE /api/data/[module]?id=<id>`
- `GET /api/sessions` (admin+)
- `GET /api/audit` (admin+)
- `POST /api/audit` (userId, action, targetType, targetId?, diff?, ip?) (authenticated)
- `GET /api/reports` (admin+)
- `POST /api/reports` (userId, moduleId, outputType, filterJson?, downloadUrl?) (admin+)
- `GET /api/pdfs` (authenticated)
- `POST /api/pdfs` (name, fileUrl) (admin+)
- `PUT /api/pdfs?id=<id>` (name) (admin+)
- `DELETE /api/pdfs?id=<id>` (super_admin)

## Role-Based Access Control

- **normal**: View data only, view PDFs
- **admin**: View/modify/add data, view/download/add/modify PDFs
- **super_admin**: All admin permissions + delete PDFs + user provisioning + module creation
- **root**: All permissions

## Pages

- `index.html` - Login page
- `user/user.html` - Normal user dashboard with module access
- `admin/admin.html` - Admin dashboard for asset management
- `super-admin/super_admin.html` - Super admin user provisioning
- `super-admin/data.html` - Module creation interface
- `pdfs.html` - PDF document management (role-based permissions)

## Project Flow

1. `index.html` login page calls `/api/auth/login`.
2. App stores JWT token in `localStorage`.
3. Role-based redirect to appropriate dashboard.
4. Modules and data requests made via `/api/modules` and `/api/data/:module`.
5. PDF management available via `pdfs.html` with role-based permissions.
