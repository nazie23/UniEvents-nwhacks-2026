# EventHive - Event Platform

A modern event discovery and management platform built with Next.js, React Bootstrap, and Supabase.

## 🚀 Quick Start

### 1. Prerequisites

-   **Node.js**: v18.0.0 or higher
-   **npm**: v9.0.0 or higher

### 2. Installation

Clone the repository and install the dependencies:

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file by copying the template:

```bash
cp .env.example .env.local
```

Fill in your **Supabase URL** and **Anon Key** from your Supabase Project Settings.

### 4. Database Setup (Supabase)

Run the following script in the **Supabase SQL Editor** to set up the `profiles` table and automated triggers:

```sql
-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  first_name text,
  last_name text,
  student_number text,
  age int,
  dietary_restrictions text,
  constraint first_name_length check (char_length(first_name) >= 1)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Trigger for auto-profile creation
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 5. Running the App

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🛠 Tech Stack

-   **Framework**: Next.js 15+ (App Router)
-   **Styling**: React Bootstrap, Vanilla CSS
-   **Authentication**: Supabase Auth (Email + Google OAuth)
-   **Database**: Supabase PostgreSQL
-   **Icons**: Lucide React
