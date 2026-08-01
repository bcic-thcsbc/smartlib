# SmartLib

## Overview

SmartLib is a modern Library Management System (LMS) built for Vietnamese secondary schools to digitize the management of physical books, library members, borrowing, returning, and inventory operations.

Unlike ebook platforms, SmartLib focuses entirely on managing real books inside a school library.

The system serves four primary goals:

- Simplify daily work for librarians.
- Provide teachers and students with an easy way to search books.
- Track every physical copy through a unique inventory code.
- Generate accurate statistics and circulation reports.

The design language emphasizes professionalism, clarity, and speed. Every screen should help users accomplish tasks with minimal clicks while remaining approachable for school staff with varying levels of computer experience.

The visual style should feel similar to Linear, Clerk Dashboard, Vercel Dashboard, Notion, or modern SaaS CMS products rather than traditional government software.

---

# Design Principles

SmartLib follows six core principles.

## 1. Clarity

Every page should have a clear purpose.

Avoid visual clutter.

Use whitespace generously.

The primary action must always be obvious.

---

## 2. Speed

Library staff perform repetitive operations all day.

Common actions such as:

- Borrow book
- Return book
- Search inventory

must require as few clicks as possible.

---

## 3. Consistency

Buttons

Cards

Tables

Dialogs

Forms

Spacing

Typography

must follow one consistent system.

---

## 4. Readability

Use large typography.

Avoid crowded tables.

Long forms should be grouped into logical sections.

---

## 5. Accessibility

Large clickable areas.

Keyboard friendly.

Proper focus states.

High color contrast.

Readable typography.

---

## 6. Scalability

The design system should support future modules without redesign.

Examples:

- QR Scanner
- Barcode Scanner
- Fine Management
- Reservation
- Notifications
- Multi-school

---

# Brand Colors

## Primary

Library Blue

#2E77DF

Primary buttons

Links

Navigation

Active menu

Charts

---

## Primary Hover

#1D4ED8

---

## Primary Soft

#DBEAFE

Selected rows

Active menu background

Information cards

---

## Success

#22C55E

Book available

Success messages

Completed actions

---

## Warning

#F59E0B

Due soon

Pending actions

Warning badges

---

## Danger

#EF4444

Lost books

Overdue

Delete actions

---

## Info

#06B6D4

General information

Statistics

---

## Background

#F8FAFC

---

## Surface

#FFFFFF

---

## Border

#E2E8F0

---

## Text Primary

#0F172A

---

## Text Secondary

#64748B

---

## Text Disabled

#94A3B8

---

# Typography

Primary Font

Be Vietnam Pro

Fallback

Inter

system-ui

Weights

400

500

600

700

800

Heading

32px

Page title

28px

Section title

22px

Card title

18px

Body

16px

Small text

14px

Never use text smaller than 13px.

---

# Border Radius

Input

10px

Button

12px

Card

20px

Dialog

24px

Avatar

999px

---

# Shadows

Card

0 8px 24px rgba(15,23,42,.06)

Hover

0 12px 32px rgba(15,23,42,.08)

Dialog

0 24px 60px rgba(15,23,42,.18)

---

# Layout

Sidebar

280px

Collapsed

80px

Header

72px

Content

max-width: 1600px

Padding

32px

Card Gap

24px

Section Gap

40px

---

# Icons

Use Lucide React only.

Default

20px

Navigation

20px

Cards

24px

Dashboard Statistics

28px

Do not mix icon libraries.

---

# Components

## Sidebar

Contains:

Dashboard

Books

Book Copies

Borrow

Users

Reports

Settings

Collapsed mode supported.

Active menu uses Primary Soft.

---

## Header

Contains

Breadcrumb

Search

Notifications

Profile

Responsive.

Sticky.

---

## Dashboard Statistic Card

Displays

Icon

Title

Value

Small trend

Optional description

Hover animation only.

No unnecessary gradients.

---

## Book Card

Shows

Cover

Title

Author

Category

Available copies

Quick action

Clean modern layout.

---

## Table

Rounded corners.

Sticky header.

Hover row.

Pagination.

Search.

Column sorting.

Responsive overflow.

---

## Forms

Grouped sections.

Large inputs.

Validation below field.

Clear required indicator.

---

## Buttons

Primary

Blue

Secondary

White

Danger

Red

Ghost

Transparent

Icon Button

Square

40px

Loading state required.

---

## Dialog

Rounded

Blur backdrop

ESC close

Click outside close

Animation

200ms

---

## Toast

Success

Green

Error

Red

Warning

Orange

Info

Blue

Top Right

Duration

3 seconds

---

## Search Box

Rounded.

Search icon.

Debounce 300ms.

Clear button.

---

## Status Badge

Available

Green

Borrowed

Blue

Overdue

Red

Lost

Gray

Damaged

Orange

Reserved

Purple

---

# Motion

Animations should be subtle.

Hover

200ms

Dialog

200ms

Sidebar

250ms

Dropdown

150ms

Page transition

200ms

Respect prefers-reduced-motion.

---

# Dashboard

Dashboard contains

Statistics

Recent borrow records

Overdue books

Recently added books

Popular books

Quick actions

Everything visible without excessive scrolling.

---

# Admin Pages

Dashboard

Users

Books

Book Copies

Borrow Management

Reports

Settings

---

# User Pages

Dashboard

Book Catalog

Book Detail

Borrow History

Profile

Change Password

---

# Empty State

Every page should have meaningful empty states.

Example

"No books found."

"Try adjusting your search keywords."

Include illustration or icon.

---

# Loading

Skeleton loading preferred.

Avoid infinite spinners.

---

# Responsive

Desktop First

1600

1440

1280

1024

768

480

Sidebar becomes Drawer on Mobile.

---

# Voice & Tone

Professional

Friendly

Clear

Simple

Avoid technical jargon.

Avoid excessive decoration.

Focus on helping librarians complete tasks efficiently.

---

# Do

Use whitespace.

Keep forms simple.

Use meaningful icons.

Prefer cards over crowded layouts.

Maintain visual consistency.

Support keyboard navigation.

---

# Don't

Do not use Bootstrap.

Do not use Material UI.

Do not use colorful gradients everywhere.

Do not overuse animations.

Do not use more than one primary color.

Do not create cluttered dashboards.

Do not place more than 6 statistic cards on one row.

Do not sacrifice usability for visual effects.

---

# UI Inspiration

The overall UI should resemble modern SaaS dashboards such as:

- Linear
- Vercel Dashboard
- Clerk
- GitHub
- Stripe Dashboard
- Notion
- Supabase

Avoid designs that resemble old government software or outdated enterprise systems.