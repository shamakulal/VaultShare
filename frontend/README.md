# VaultShare

A secure full-stack file storage and sharing application that allows authenticated users to upload, manage, organize, and securely share files.

Users can control file visibility, create public share links, protect shared files with passwords, set expiration dates, and limit the number of downloads.

## Features

### Authentication

* User registration
* User login and logout
* JWT-based authentication
* HTTP-only cookie authentication
* Protected routes
* Authenticated user sessions

### File Management

* Upload files securely
* Support for files larger than 100 MB
* File size validation
* Upload progress and loading states
* View uploaded files in a personal dashboard
* Download owned files
* Delete files
* View file name, type, size, and upload date
* Search files by name
* Filter files by visibility

### File Visibility

Files are private by default after upload.

Users can change file visibility directly from the dashboard:

* Private files are accessible only to the authenticated owner.
* Public files can be made available for sharing.

### Secure File Sharing

* Create unique share links
* Public access through a share token
* Optional password protection
* Share link expiration
* Maximum download limits
* Download counting
* Disable expired or inactive links
* Public share page without requiring login

### User Experience

* Responsive dashboard
* Responsive public share page
* Responsive authentication pages
* Loading states
* Action loading indicators
* Success and error notifications
* Search and filtering
* Mobile-friendly interface

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router

### Backend

* Node.js
* Express.js
* TypeScript
* JWT Authentication
* HTTP-only Cookies

### Database

* MySQL

## Project Structure

```text
VaultShare/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   │
│   ├── uploads/
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   └── dashboard/
│   │   ├── services/
│   │   └── schemas/
│   │
│   ├── package.json
│   └── .env
│
└── README.md
```

## Application Flow

```text
User
 │
 ├── Register
 │
 ├── Login
 │
 └── Dashboard
       │
       ├── Upload File
       │      │
       │      └── Default Visibility: Private
       │
       ├── Search Files
       │
       ├── Filter Files
       │
       ├── Change Visibility
       │      │
       │      ├── Private
       │      │
       │      └── Public
       │
       ├── Download File
       │
       ├── Delete File
       │
       └── Create Share Link
              │
              ├── Optional Password
              ├── Optional Expiration
              ├── Optional Download Limit
              │
              └── Public Share URL
                       │
                       ├── Verify Password
                       │
                       └── Download File
```

## Installation and Setup

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* MySQL Server

## Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=vaultshare

JWT_SECRET=your_secure_jwt_secret

UPLOAD_DIR=uploads
```

Start the backend server:

```bash
npm run dev
```

The backend API should run on:

```text
http://localhost:5000
```

## Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend application:

```bash
npm run dev
```

The frontend should run on:

```text
http://localhost:5173
```

## Database

Create the database:

```sql
CREATE DATABASE vaultshare;
```

Use the VaultShare database:

```sql
USE vaultshare;
```

The application uses the following main tables:

```text
users
files
share_links
file_activities
```

### Table Purpose

#### users

Stores user account information.

#### files

Stores uploaded file metadata, including:

* Original file name
* Storage location
* MIME type
* File size
* Visibility
* Owner
* Creation date

#### share_links

Stores secure sharing information, including:

* Share token
* Password protection
* Expiration date
* Download limits
* Download count
* Active status

#### file_activities

Stores file-related activity information.

## API Overview

### Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
```

### Files

```text
GET    /api/files
POST   /api/files/upload
GET    /api/files/:fileId/download
PATCH  /api/files/:fileId/visibility
DELETE /api/files/:fileId
```

### File Sharing

```text
POST   /api/files/:fileId/share

GET    /api/share/:shareToken

POST   /api/share/:shareToken/verify-password

GET    /api/share/:shareToken/download
```

## Security Features

VaultShare implements several security controls:

* Authentication for protected operations
* JWT-based session handling
* HTTP-only authentication cookies
* File ownership checks
* Private file authorization
* Password-protected share links
* Share link expiration
* Download limits
* Unique cryptographically generated share tokens
* File size validation
* Protected backend routes

## File Visibility Model

Every newly uploaded file is private by default.

```text
Upload File
    |
    v
Private by Default
    |
    v
User Controls Visibility
    |
    +--> Private
    |      |
    |      +--> Accessible only by the owner
    |
    +--> Public
           |
           +--> Available for sharing
```

This allows users to control access to their files directly from the dashboard.

## Share Link Model

Share links provide additional controls beyond file visibility.

A user can create a share link with:

* Password protection
* Expiration date
* Maximum download count

Example flow:

```text
File
  |
  v
Create Share Link
  |
  v
Generate Unique Share Token
  |
  +--> Password Protected
  |
  +--> Expiration Enabled
  |
  +--> Download Limit Enabled
  |
  v
Public Share URL
```

## Testing Checklist

### Authentication

* Register a new user
* Login with valid credentials
* Login with invalid credentials
* Logout
* Access protected routes without authentication

### File Upload

* Upload a valid file
* Upload a file larger than 100 MB
* Test invalid file input
* Verify uploaded file appears in the dashboard

### File Management

* Search by full file name
* Search by partial file name
* Filter private files
* Filter public files
* Change visibility
* Download a file
* Delete a file

### Share Links

* Create a normal share link
* Create a password-protected share link
* Verify an incorrect password
* Verify a correct password
* Test an expired link
* Test maximum download limits
* Verify download count increases
* Download through a public share URL

### Responsive Testing

Test the application on:

* Desktop
* Tablet
* Mobile devices

Verify that:

* Navigation remains usable
* File cards adapt correctly
* Search and filters remain accessible
* Share controls fit the screen
* Public share pages remain responsive

## Environment Variables

### Backend

```env
PORT=
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=
UPLOAD_DIR=
```

### Frontend

```env
VITE_API_URL=
```

Do not commit actual `.env` files containing secrets.

Add the following to `.gitignore`:

```gitignore
node_modules/
.env
dist/
uploads/
```

## Future Improvements

Possible future enhancements include:

* Drag and drop file upload
* Real-time upload progress percentage
* File preview for images and PDFs
* File folders and organization
* Bulk file operations
* Rename files
* File activity history
* Email notifications for shared files
* Cloud object storage
* User storage quotas
* Rate limiting
* Virus scanning
* Audit logs

## Assignment Requirements Coverage

| Requirement                | Status      |
| -------------------------- | ----------- |
| User registration          | Implemented |
| User login                 | Implemented |
| Secure authentication      | Implemented |
| File upload                | Implemented |
| Files larger than 100 MB   | Implemented |
| File validation            | Implemented |
| Upload loading states      | Implemented |
| Personal dashboard         | Implemented |
| Private files              | Implemented |
| Public files               | Implemented |
| Visibility control         | Implemented |
| Shareable links            | Implemented |
| Password-protected sharing | Implemented |
| Download limits            | Implemented |
| Share expiration           | Implemented |
| Download counting          | Implemented |
| Responsive UI              | Implemented |

## Author

Shama
https://porfolio-shama.netlify.app/
```
```
