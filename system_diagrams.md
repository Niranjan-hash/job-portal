# Job Portal System Diagrams

This document contains the Data Flow Diagrams (DFD) and Entity Relationship (ER) diagram for the Job Portal system.

## 1. DFD Level 1: System Overview

The Level 1 DFD shows the primary processes and data flows between user roles and the system modules.

```mermaid
graph TD
    User((User / Recruiter))
    Admin((Admin))
    
    subgraph Job Portal System
        P1[Authentication & Profile Management]
        P2[Job Management]
        P3[Search & Discovery]
        P4[Application Processing]
        P5[Notification & Chat]
    end
    
    DS1[(Users & Profiles DB)]
    DS2[(Jobs DB)]
    DS3[(Applications & Resumes DB)]
    DS4[(Notifications & Logs DB)]
    
    User -->|Login/Signup| P1
    P1 <--> DS1
    
    User -->|Post/Edit Job| P2
    P2 <--> DS2
    
    User -->|Search Jobs/Users| P3
    P3 --- DS2
    P3 --- DS1
    
    User -->|Apply for Job| P4
    P4 <--> DS3
    P4 --- DS2
    
    P4 -->|Trigger| P5
    P5 <--> DS4
    P5 -->|Notify| User
    
    Admin -->|Manage Users/Jobs| P1
    Admin -->|Manage All Data| P2
```

## 2. DFD Level 2: Job Application Flow

Detailed view of the process when a user applies for a job.

```mermaid
graph TD
    Seeker((Job Seeker))
    
    P4_1[Validate Session & Profile]
    P4_2[Check/Upload Resume]
    P4_3[Create Application Record]
    P4_4[Notify Recruiter & Seeker]
    
    DS_Users[(Users DB)]
    DS_Jobs[(Jobs DB)]
    DS_App[(Applications DB)]
    DS_Resume[(Resumes DB)]
    DS_Notif[(Notifications DB)]
    
    Seeker -->|Apply Request| P4_1
    P4_1 --- DS_Users
    
    P4_1 -->|Valid| P4_2
    P4_2 <--> DS_Resume
    
    P4_2 -->|Resume Ready| P4_3
    P4_3 --- DS_Jobs
    P4_3 <--> DS_App
    
    P4_3 -->|Success| P4_4
    P4_4 <--> DS_Notif
    P4_4 -->|Confirmation| Seeker
```

## 3. Entity Relationship (ER) Diagram

Represents the database schema and relationships between entities.

```mermaid
erDiagram
    USER ||--|| PROFILE : "has"
    USER ||--o{ JOB_DETAIL : "posts"
    USER ||--o{ APPLICATION : "applies"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ RESUME : "owns"
    
    JOB_DETAIL ||--o{ APPLICATION : "received"
    
    USER {
        ObjectId _id
        string userName
        string userid "email"
        string password "hashed"
        boolean isVerified
        boolean isAdmin
    }
    
    PROFILE {
        ObjectId _id
        string userId "FK"
        string name
        string email
        string location
        string bio
        string profilePic
    }
    
    JOB_DETAIL {
        ObjectId _id
        string title
        string company
        string location
        string type "Full Time/Part Time"
        string salary
        string skills
        string description
        string postedby "FK (User ID)"
        date createdAt
    }
    
    APPLICATION {
        ObjectId _id
        string jobId "FK"
        string userId "FK"
        string resumeUrl
        string status "pending/accepted/rejected"
        date createdAt
    }
    
    RESUME {
        ObjectId _id
        string userId "FK"
        string fileName
        date createdAt
    }
    
    NOTIFICATION {
        ObjectId _id
        string recipientId "FK"
        string senderId "FK"
        string message
        boolean isRead
        string type
        date createdAt
    }
```
