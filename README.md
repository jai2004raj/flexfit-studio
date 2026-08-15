💪 FlexFit Studio

A full-stack gym management and class booking platform designed for a single fitness studio. FlexFit Studio enables members to manage

memberships, book fitness classes, use class credits, and join waitlists, while staff can operate the front desk, manage trainers, 

monitor memberships, and access operational reports.

The platform also supports corporate credit pools, allowing companies to purchase credits that their employees can use when booking gym 

classes.

-> 📋 Table of Contents

1. Overview

2. Key Features

3. User Roles

4. Technology Stack

5. Project Structure

6. Prerequisites

7. Installation

8. Database Setup

9. Running the Application

10. Demo Accounts

11. Available Commands

12. Core Workflows

13. Database

14. Testing

15. Production Build

16. Development Notes

17. Future Enhancements

18. License

-> 🎯 Overview

FlexFit Studio is a gym and fitness studio management application that brings member management, class scheduling, memberships,

credits, trainers, bookings, waitlists, and reporting into a single platform.

The system is designed around three primary user groups:

Members – book classes, manage memberships, use credits, and join waitlists.

Staff/Admins – manage the gym's daily operations, members, trainers, classes, and reports.

Corporate Clients – purchase credit pools that employees can use to access gym classes.

The application uses a local SQLite database, making it simple to set up and run without requiring a separate database server.

-> ✨ Key Features

a) 👤 Member Management

1. Member registration and authentication

2. Member profile management

3. Membership management

4. Class credit tracking

5. Booking history

6. Upcoming class bookings

7. Corporate membership/credit support

b) 🏋️ Class Management

1. Create and manage fitness classes

2. View scheduled classes

3. Assign trainers

4. Define class capacity

5. Track available seats

6. Manage class bookings

7. Support class waitlists

c) 🎟️ Memberships

Members can:

1.Purchase memberships

2.View active memberships

3.Track membership status

4.Use membership benefits

5.Consume class credits

d) 💳 Class Credits

The platform supports credit-based class booking.

Credits can be:

Included with memberships,purchased through plans, allocated through corporate credit pools consumed when members book eligible classes.

e) ⏳ Waitlists

When a class reaches its maximum capacity, members can join a waitlist.

The system can track:

1. Class capacity
2. Current bookings
3. Waitlisted members
4. Booking availability

f) 🧑‍🏫 Trainer Management

Staff can manage trainers and their class assignments.

Trainer-related functionality includes:

1. Trainer profiles

2. Trainer assignment

3.Class schedules

4. Trainer-specific class information


g) 🏢 Corporate Credit Pools

Companies can purchase pools of class credits for their employees.

This allows organizations to:

1. Allocate fitness benefits to employees

2. Purchase credits in bulk

3.Allow employees to book classes using company credits

4.Track corporate credit usage

h) 📊 Reports & Operations

Staff can access operational information related to:

1.Memberships

2.Class bookings

3.Credit usage

4.Trainers

5.Revenue

6.Gym activity

i) 👥 User Roles

FlexFit Studio provides role-based access for different types of users.

1.Role	Description

2.Admin	Full access to gym management and administrative functionality

3.Trainer	Access to trainer-related classes and schedules

4.Member	Books classes, manages memberships, uses credits, and joins waitlists

j) 🛠️ Technology Stack

1.Frontend

2.Next.js

3.React

4.TypeScript

5.Tailwind CSS

6.Backend

7.Next.js Server

8.tRPC

9.TypeScript

10.Database

11.SQLite

12.Drizzle ORM

13.Development Tools

14.Node.js 20+

15.pnpm

16.Vitest

The repository includes Drizzle configuration, a SQLite database setup, TypeScript configuration, Tailwind configuration, and Vitest 

configuration.

📁 Project Structure

flexfit-studio/
│
├── documents/
│
├── src/
│   ├── app/
│   │   └── routes and pages
│   │
│   ├── components/
│   │   └── shared UI components
│   │
│   ├── db/
│   │   ├── schema.ts
│   │   ├── client.ts
│   │   └── seed.ts
│   │
│   ├── lib/
│   │   └── utility functions and helpers
│   │
│   └── server/
│       └── tRPC routers
│
├── tests/
│
├── .gitignore
├── drizzle.config.ts
├── next.config.mjs
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts

The repository currently follows a separation between application routes, reusable components, database functionality, utility 

libraries, server-side routers, and tests.

📦 Prerequisites

Before running the project, make sure the following are installed:

Node.js 20 or newer

pnpm

Check your Node.js version:

node --version

Install pnpm globally if required:

npm install -g pnpm

🚀 Installation

1. Clone the repository

git clone https://github.com/jai2004raj/flexfit-studio.git

2. Navigate into the project

cd flexfit-studio

3. Install dependencies

pnpm install

🗄️ Database Setup

FlexFit Studio uses SQLite, so a separate database server is not required.

Create and apply the database schema:

pnpm db:push

Populate the database with sample data:

pnpm db:seed

The seed operation creates sample members, plans, classes, and bookings.

▶️ Running the Application

Start the development server:

pnpm dev

The application will be available at:

http://localhost:3000

🔐 Demo Accounts

The seeded database provides demo accounts for different roles.

Role	Email	Password

Admin	admin@flexfit.test	admin123

Trainer	arjun@flexfit.test	trainer123

Member	rahul.k@example.com	member123

Other seeded member accounts can be found in:

src/db/seed.ts

Security Note: These credentials are intended for local development/demo purposes only. Do not use them in a production deployment.

⚙️ Available Commands

Command	Description

pnpm install	Install project dependencies

pnpm dev	Start the development server

pnpm build	Create a production build

pnpm db:push	Apply the database schema

pnpm db:seed	Clear and reseed the database

pnpm db:reset	Delete, recreate, and reseed the database

npx tsc --noEmit	Type-check the project

The project's existing scripts include database push, seed, reset, development, and production build workflows.

🔄 Core Workflows

Member Booking Workflow

Member Login
     │
     ▼
Browse Classes
     │
     ▼
Select Class
     │
     ├── Seats Available ──► Book Class
     │                           │
     │                           ▼
     │                     Deduct Credit
     │
     └── Class Full ───────► Join Waitlist

Membership Workflow

Member
  │
  ▼
Browse Membership Plans
  │
  ▼
Purchase Membership
  │
  ▼
Membership Activated
  │
  ▼
Receive/Use Class Credits
  │
  ▼
Book Fitness Classes

Corporate Credit Workflow

Company
   │
   ▼
Purchase Credit Pool
   │
   ▼
Allocate Credits
   │
   ▼
Employee Uses Credits
   │
   ▼
Book Gym Class
   │
   ▼
Corporate Pool Balance Updated

🧮 Credit Management

Credits are an important part of the FlexFit Studio booking system.

A typical booking process involves:

Member selects a class.

System checks class availability.

System verifies the member's available credits or eligible membership.

Booking is created.

Required credits are consumed.

Class availability is updated.

If the class is full, the member can be placed on the waitlist instead.

⏳ Waitlist Management

When a class reaches its configured capacity, additional members can join the waitlist.

The waitlist helps the studio manage demand for popular classes and provides a mechanism for members to obtain a place when a booking 

becomes available.

🧑‍💼 Staff Operations

Staff and administrators can manage the operational side of the gym, including:

1.Members

2.Trainers

3.Classes

4.Membership plans

5.Bookings

6.Credits

7.Corporate accounts

8.Revenue information

9.Gym activity

This provides a centralized management system instead of relying on separate spreadsheets or manual records.

🗃️ Database

The application uses SQLite as its database.

The database is file-based, which means developers do not need to install or configure PostgreSQL, MySQL, or another database server 

for local development.

The database schema is maintained in:

src/db/schema.ts

Seed data is maintained in:

src/db/seed.ts

Database configuration is maintained through:

drizzle.config.ts

🧪 Testing

The project includes a test setup using Vitest.

Run TypeScript type checking with:

npx tsc --noEmit

Tests can be executed using the project's configured Vitest command:

pnpm test

🏗️ Production Build

Before creating a production build, stop the development server.

Then run:

pnpm build

For local production testing:

pnpm build

pnpm start

Important Development Note

Do not run:

pnpm build

while:

pnpm dev

is running.

The Next.js build process can modify the .next directory used by the development server.

If this causes development-server errors, stop the server, remove .next, and restart the application:

rm -rf .next

pnpm dev

On Windows PowerShell:

Remove-Item -Recurse -Force .next

pnpm dev

For type checking while the development server is running, use:

npx tsc --noEmit

🔧 Database Development Note

Whenever changes are made to:

src/db/schema.ts

apply the updated schema using:

pnpm db:push

This keeps the database structure synchronized with the application's schema.

🧹 Resetting Development Data

If the local database gets into an inconsistent state, the project provides:

pnpm db:reset

This removes the existing database and recreates it with fresh seed data.

Warning: This command is destructive and should only be used when you are comfortable losing the existing local database data.

🔮 Future Enhancements

Potential improvements for future versions include:

1.Online payment gateway integration

2.Email and SMS notifications

3.Automated waitlist promotion

4.Advanced revenue analytics

5.Attendance and check-in management

6.QR-code based member check-in

7.Mobile application

8.Trainer availability management

9.Automated membership renewal reminders

10.Subscription auto-renewal

11.Detailed corporate dashboards

12.Exportable financial reports

13.Advanced role and permission management

14.Cloud database support

15.Production deployment configuration

📌 Project Goals

FlexFit Studio aims to provide a centralized solution for managing the day-to-day operations of a modern fitness studio.

The main goals are:

Simplify gym administration

Improve member booking experience

Automate credit management

Reduce manual membership tracking

Manage trainers and classes efficiently

Support waitlisted classes

Enable corporate fitness benefits

Provide useful operational and revenue information

📚 Project Information

Project: FlexFit Studio

Type: Full-Stack Gym Management Application

Architecture: Full-stack web application

Database: SQLite

ORM: Drizzle ORM

Frontend: Next.js + React + TypeScript

Backend: Next.js + tRPC

Styling: Tailwind CSS

Package Manager: pnpm

Development Port: 3000


📄 License

This repository does not currently specify a separate open-source license.

If this project is intended to be distributed publicly, add an appropriate LICENSE file to the repository.

👨‍💻 Author

Jairaj July

GitHub:

https://github.com/jai2004raj

Project Repository:

https://github.com/jai2004raj/flexfit-studio

⭐ Acknowledgements

FlexFit Studio was developed as a full-stack gym management project focused on real-world fitness studio workflows including 

memberships, class bookings, credits, waitlists, trainers, front-desk operations, and corporate fitness benefits.

FlexFit Studio — Manage your gym. Empower your members.
