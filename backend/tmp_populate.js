const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const JobDetail = require('./model/jobdetail');
const User = require('./model/newuser');
const Profile = require('./model/profile');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jobportal';

// User 1 jobs (30 items)
const user1JobsRaw = [
{ "title":"Frontend Developer", "company":"TechNova Solutions", "location":"Bangalore, India", "salary":"70k - 100k", "type":"Full Time", "skills":"React, JavaScript, CSS, HTML", "description":"Develop modern responsive interfaces using React.\nCollaborate with designers to build reusable UI components.\nOptimize performance and maintain clean frontend architecture.", "contact":"jobs@technova.com" },
{ "title":"Backend Developer", "company":"CloudAxis Technologies", "location":"Hyderabad, India", "salary":"80k - 110k", "type":"Full Time", "skills":"Node.js, Express, MongoDB", "description":"Design and develop RESTful APIs.\nMaintain server logic and database interactions.\nEnsure application scalability and security.", "contact":"careers@cloudaxis.com" },
{ "title":"Full Stack Developer", "company":"DevFusion Labs", "location":"Chennai, India", "salary":"90k - 120k", "type":"Full Time", "skills":"React, Node.js, MongoDB", "description":"Build complete web applications using MERN stack.\nIntegrate frontend interfaces with backend services.\nMaintain performance and application stability.", "contact":"hr@devfusion.com" },
{ "title":"React Developer", "company":"PixelWave", "location":"Remote", "salary":"75k - 105k", "type":"Full Time", "skills":"React, Redux, TypeScript", "description":"Develop reusable React components.\nImplement state management with Redux.\nEnsure responsive design and accessibility.", "contact":"jobs@pixelwave.com" },
{ "title":"Node.js Developer", "company":"DataBridge Technologies", "location":"Pune, India", "salary":"85k - 115k", "type":"Full Time", "skills":"Node.js, Express, MongoDB", "description":"Develop backend services and APIs.\nOptimize database queries and server performance.\nCollaborate with frontend developers.", "contact":"hr@databridge.com" },
{ "title":"UI Designer", "company":"CreativePixels", "location":"Mumbai, India", "salary":"60k - 85k", "type":"Full Time", "skills":"Figma, Adobe XD, UI Design", "description":"Design clean and modern user interfaces.\nCreate prototypes and design systems.\nCollaborate with product and engineering teams.", "contact":"design@creativepixels.com" },
{ "title":"UX Designer", "company":"UserFlow Labs", "location":"Delhi, India", "salary":"65k - 90k", "type":"Full Time", "skills":"User Research, Wireframes", "description":"Conduct usability research and testing.\nDesign wireframes and prototypes.\nImprove overall user experience.", "contact":"careers@userflow.com" },
{ "title":"DevOps Engineer", "company":"CloudMatrix", "location":"Remote", "salary":"100k - 140k", "type":"Full Time", "skills":"Docker, Kubernetes, AWS", "description":"Maintain CI/CD pipelines.\nAutomate deployment processes.\nEnsure system reliability and monitoring.", "contact":"jobs@cloudmatrix.com" },
{ "title":"Software Engineer", "company":"NextWave Systems", "location":"Bangalore, India", "salary":"95k - 135k", "type":"Full Time", "skills":"JavaScript, Node.js", "description":"Develop scalable software solutions.\nWork with cross-functional teams.\nMaintain high coding standards.", "contact":"careers@nextwave.com" },
{ "title":"Mobile App Developer", "company":"AppCraft", "location":"Hyderabad, India", "salary":"80k - 120k", "type":"Full Time", "skills":"React Native, JavaScript", "description":"Develop cross-platform mobile apps.\nIntegrate APIs and backend services.\nEnsure smooth user experience.", "contact":"hr@appcraft.com" },
{ "title":"Data Analyst", "company":"Insight Analytics", "location":"Delhi, India", "salary":"70k - 100k", "type":"Full Time", "skills":"Python, SQL, Power BI", "description":"Analyze large datasets to identify trends.\nCreate dashboards and reports.\nSupport business decision-making.", "contact":"jobs@insightanalytics.com" },
{ "title":"Machine Learning Engineer", "company":"AI Nexus", "location":"Bangalore, India", "salary":"110k - 160k", "type":"Full Time", "skills":"Python, TensorFlow", "description":"Develop machine learning models.\nTrain and evaluate AI algorithms.\nDeploy models into production systems.", "contact":"careers@ainexus.com" },
{ "title":"Cybersecurity Analyst", "company":"SecureNet", "location":"Hyderabad, India", "salary":"90k - 130k", "type":"Full Time", "skills":"Network Security, SIEM", "description":"Monitor security threats.\nInvestigate system vulnerabilities.\nImplement security best practices.", "contact":"security@securenet.com" },
{ "title":"QA Engineer", "company":"TestWorks", "location":"Chennai, India", "salary":"70k - 95k", "type":"Full Time", "skills":"Selenium, Automation Testing", "description":"Develop automated test scripts.\nPerform functional and regression testing.\nEnsure software quality and stability.", "contact":"hr@testworks.com" },
{ "title":"Product Manager", "company":"InnovateHub", "location":"Mumbai, India", "salary":"100k - 140k", "type":"Full Time", "skills":"Product Strategy, Agile", "description":"Define product roadmap and features.\nCoordinate development teams.\nDeliver products aligned with business goals.", "contact":"careers@innovatehub.com" },
{ "title":"Technical Writer", "company":"DocuTech", "location":"Remote", "salary":"60k - 80k", "type":"Part Time", "skills":"Technical Documentation", "description":"Write product documentation and guides.\nSimplify complex technical concepts.\nCollaborate with developers.", "contact":"jobs@docutech.com" },
{ "title":"Database Administrator", "company":"DataGuard", "location":"Pune, India", "salary":"85k - 120k", "type":"Full Time", "skills":"MySQL, MongoDB", "description":"Maintain database performance.\nHandle backups and security.\nOptimize queries and indexing.", "contact":"hr@dataguard.com" },
{ "title":"Cloud Engineer", "company":"SkyCloud", "location":"Bangalore, India", "salary":"100k - 140k", "type":"Full Time", "skills":"AWS, Azure", "description":"Deploy and manage cloud infrastructure.\nMonitor system performance.\nImplement cloud security practices.", "contact":"careers@skycloud.com" },
{ "title":"IT Support Engineer", "company":"HelpDesk Pro", "location":"Coimbatore, India", "salary":"50k - 70k", "type":"Full Time", "skills":"Networking, Troubleshooting", "description":"Provide IT support to employees.\nResolve hardware and software issues.\nMaintain system uptime.", "contact":"support@helpdeskpro.com" },
{ "title":"Game Developer", "company":"PlayForge Studios", "location":"Remote", "salary":"80k - 120k", "type":"Full Time", "skills":"Unity, C#", "description":"Develop engaging video games.\nDesign game mechanics and features.\nOptimize game performance.", "contact":"jobs@playforge.com" },
{ "title":"Business Analyst", "company":"DataStrategy Solutions", "location":"Pune, India", "salary":"75k - 105k", "type":"Full Time", "skills":"Business Analysis, SQL, Data Modeling", "description":"Analyze business requirements and translate them into technical solutions.\nWork with stakeholders to gather requirements.\nPrepare documentation and process improvements.", "contact":"careers@datastrategy.com" },
{ "title":"SEO Specialist", "company":"RankBoost Digital", "location":"Delhi, India", "salary":"60k - 85k", "type":"Full Time", "skills":"SEO, Google Analytics, Keyword Research", "description":"Optimize websites for search engines.\nConduct keyword research and performance analysis.\nImprove website traffic through SEO strategies.", "contact":"jobs@rankboost.com" },
{ "title":"Digital Marketing Manager", "company":"AdGrowth Media", "location":"Mumbai, India", "salary":"80k - 110k", "type":"Full Time", "skills":"SEO, SEM, Social Media Marketing", "description":"Plan and execute digital marketing campaigns.\nAnalyze campaign performance and ROI.\nManage social media and advertising strategies.", "contact":"hr@adgrowth.com" },
{ "title":"System Administrator", "company":"NetSecure Systems", "location":"Chennai, India", "salary":"75k - 100k", "type":"Full Time", "skills":"Linux, Networking, Server Management", "description":"Manage company servers and infrastructure.\nEnsure system uptime and performance.\nImplement security patches and updates.", "contact":"admin@netsecure.com" },
{ "title":"Blockchain Developer", "company":"CryptoLabs", "location":"Remote", "salary":"110k - 150k", "type":"Full Time", "skills":"Solidity, Ethereum, Web3", "description":"Develop decentralized blockchain applications.\nWrite smart contracts using Solidity.\nIntegrate blockchain technology with existing systems.", "contact":"jobs@cryptolabs.com" },
{ "title":"AI Research Engineer", "company":"DeepLogic AI", "location":"Bangalore, India", "salary":"120k - 170k", "type":"Full Time", "skills":"Python, AI, Deep Learning", "description":"Research and develop artificial intelligence models.\nImplement deep learning algorithms.\nPublish research findings and improve AI solutions.", "contact":"careers@deeplogic.com" },
{ "title":"Network Engineer", "company":"LinkNet Technologies", "location":"Hyderabad, India", "salary":"70k - 100k", "type":"Full Time", "skills":"Networking, Cisco, Routing", "description":"Design and maintain enterprise network infrastructure.\nTroubleshoot connectivity issues.\nEnsure network security and stability.", "contact":"jobs@linknet.com" },
{ "title":"Data Scientist", "company":"InsightData Labs", "location":"Bangalore, India", "salary":"110k - 150k", "type":"Full Time", "skills":"Python, Machine Learning, Data Analysis", "description":"Analyze large datasets and build predictive models.\nUse machine learning algorithms for data insights.\nCommunicate findings to stakeholders.", "contact":"hr@insightdata.com" },
{ "title":"Graphic Designer", "company":"CreativeStudio", "location":"Mumbai, India", "salary":"55k - 80k", "type":"Full Time", "skills":"Photoshop, Illustrator, Graphic Design", "description":"Design marketing materials and graphics.\nWork with marketing teams for campaigns.\nMaintain consistent brand visuals.", "contact":"design@creativestudio.com" },
{ "title":"Technical Support Engineer", "company":"TechAssist", "location":"Coimbatore, India", "salary":"50k - 70k", "type":"Full Time", "skills":"Troubleshooting, Networking, IT Support", "description":"Provide technical support to customers.\nResolve system issues and service requests.\nDocument technical problems and solutions.", "contact":"support@techassist.com" }
];

// User 2 jobs (30 items) - COMPLETELY DIFFERENT JOBS
const user2JobsRaw = [
{ "title":"Golang Developer", "company":"GoStream Solutions", "location":"Bangalore, India", "salary":"120k - 170k", "type":"Full Time", "skills":"Golang, Kubernetes, Microservices", "description":"Build high-performance microservices using Golang.\nOptimize cloud infrastructure and deployment pipelines.\nWork with distributed systems and real-time data streaming.", "contact":"dev@gostream.io" },
{ "title":"Kotlin Developer", "company":"MobileLogic", "location":"Hyderabad, India", "salary":"95k - 140k", "type":"Full Time", "skills":"Kotlin, Android, MVVM", "description":"Develop native Android applications using Kotlin.\nIntegrate modern libraries and reactive programming.\nEnsure high-quality UI/UX for mobile users.", "contact":"careers@mobilelogic.com" },
{ "title":"Ruby on Rails Developer", "company":"StartupSprint", "location":"Remote", "salary":"100k - 150k", "type":"Full Time", "skills":"Ruby, Rails, PostgreSQL", "description":"Develop robust web applications using Ruby on Rails.\nMaintain backend APIs and third-party integrations.\nOptimize performance and database scalability.", "contact":"apply@startupsprint.com" },
{ "title":"Flutter Developer", "company":"CrossPlatform Labs", "location":"Pune, India", "salary":"80k - 120k", "type":"Full Time", "skills":"Flutter, Dart, Firebase", "description":"Build cross-platform mobile apps for iOS and Android using Flutter.\nMaintain clean code and efficient state management.\nDesign smooth animations and transitions.", "contact":"jobs@crossplatform.com" },
{ "title":"System Security Engineer", "company":"CyberFortress", "location":"Mumbai, India", "salary":"110k - 160k", "type":"Full Time", "skills":"Penetration Testing, Ethical Hacking", "description":"Audit internal systems for security vulnerabilities.\nImplement enterprise-level security protocols.\nProtect sensitive company data from cyber threats.", "contact":"security@cyberfortress.net" },
{ "title":"Data Warehouse Architect", "company":"BigData Corp", "location":"Chennai, India", "salary":"130k - 190k", "type":"Full Time", "skills":"Snowflake, Redshift, SQL", "description":"Design and implement data warehousing solutions.\nManage data ingestion and transformation workflows.\nEnsure high availability of analytics platforms.", "contact":"hr@bigdatacorp.com" },
{ "title":"Scala Developer", "company":"FunctionalSystems", "location":"Remote", "salary":"120k - 180k", "type":"Full Time", "skills":"Scala, Akka, Spark", "description":"Develop functional software solutions using Scala.\nManage distributed computing tasks with Akka and Spark.\nBuild scalable data processing applications.", "contact":"careers@functionalsystems.com" },
{ "title":"Vue.js Developer", "company":"ModernWeb Labs", "location":"Delhi, India", "salary":"75k - 110k", "type":"Full Time", "skills":"Vue.js, Vuex, JavaScript", "description":"Design interactive frontend applications using Vue.js.\nImplement state management and component libraries.\nCollaborate with UX designers and backend engineers.", "contact":"jobs@modernweb.io" },
{ "title":"API Security Specialist", "company":"SecureAPI", "location":"Bangalore, India", "salary":"115k - 165k", "type":"Full Time", "skills":"OAuth2, JWT, Security Compliance", "description":"Scan and secure RESTful and GraphQL APIs.\nImplement authentication and authorization best practices.\nMonitor for unauthorized access and data leaks.", "contact":"careers@secureapi.com" },
{ "title":"E-learning Content Developer", "company":"EduTech Pro", "location":"Hyderabad, India", "salary":"60k - 90k", "type":"Full Time", "skills":"Instructional Design, Articulate Storyline", "description":"Create engaging interactive learning modules.\nCollaborate with subject matter experts on course design.\nEnsure high instructional quality and accessibility.", "contact":"hr@edutechpro.edu" },
{ "title":"Swift Developer", "company":"AppleCloud", "location":"Remote", "salary":"110k - 160k", "type":"Full Time", "skills":"Swift, iOS, SwiftUI", "description":"Build high-performance iOS applications using Swift.\nMaintain modern UI with SwiftUI and Combine.\nOptimize app responsiveness and battery usage.", "contact":"jobs@applecloud.com" },
{ "title":"Salesforce Developer", "company":"CloudCRM", "location":"Pune, India", "salary":"90k - 130k", "type":"Full Time", "skills":"Apex, Lightning, SOQL", "description":"Develop custom Salesforce modules and integrations.\nOptimize CRM workflows and automate business processes.\nCollaborate with business analysts on requirements.", "contact":"careers@cloudcrm.io" },
{ "title":"PHP Laravel Developer", "company":"WebBuilders", "location":"Mumbai, India", "salary":"70k - 110k", "type":"Full Time", "skills":"PHP, Laravel, MySQL", "description":"Develop scalable web backends using Laravel.\nMaintain relational databases and API services.\nImplement clean MVC architecture and security.", "contact":"hr@webbuilders.com" },
{ "title":"Infrastructure Specialist", "company":"DataLink Systems", "location":"Chennai, India", "salary":"100k - 140k", "type":"Full Time", "skills":"Networking, Server Hardware, Virtualization", "description":"Manage enterprise data center infrastructure.\nTroubleshoot hardware failures and network issues.\nEnsure system reliability and disaster recovery.", "contact":"admin@datalink.com" },
{ "title":"Angular Developer", "company":"EnterpriseFront", "location":"Hyderabad, India", "salary":"85k - 125k", "type":"Full Time", "skills":"Angular, TypeScript, RxJS", "description":"Build complex enterprise frontend apps with Angular.\nManage async data flows using RxJS and NgRx.\nEnsure cross-browser compatibility and unit testing.", "contact":"jobs@enterprisefront.com" },
{ "title":"BI Developer", "company":"InsightStream", "location":"Bangalore, India", "salary":"90k - 130k", "type":"Full Time", "skills":"Tableau, SQL, ETL", "description":"Design and build business intelligence dashboards.\nAnalyze data trends and provide actionable insights.\nMaintain data processing and reporting tools.", "contact":"hr@insightstream.io" },
{ "title":"Information Security Officer", "company":"SafeNet", "location":"Remote", "salary":"120k - 175k", "type":"Full Time", "skills":"ISO 27001, Compliance, Risk Management", "description":"Manage internal information security standards.\nOversee compliance audits and risk assessment.\nTrain employees on cybersecurity best practices.", "contact":"security@safenet.org" },
{ "title":"SRE Engineer", "company":"ReliableCloud", "location":"Pune, India", "salary":"130k - 180k", "type":"Full Time", "skills":"Python, Terraform, Monitoring", "description":"Improve system reliability and automate maintenance.\nManage infrastructure as code using Terraform.\nImplement monitoring and incident response protocols.", "contact":"careers@reliablecloud.net" },
{ "title":"Technical Consultant", "company":"ConsultingGroup", "location":"Delhi, India", "salary":"100k - 150k", "type":"Full Time", "skills":"Solution Design, Client Management", "description":"Provide technical strategy to enterprise clients.\nDesign solution architectures for business problems.\nOversee project delivery and technical quality.", "contact":"apply@consultinggroup.com" },
{ "title":"C++ Software Engineer", "company":"CoreLogic", "location":"Bangalore, India", "salary":"110k - 160k", "type":"Full Time", "skills":"C++, Multithreading, Linux", "description":"Develop low-level system software using C++.\nOptimize multithreaded performance and memory usage.\nWork on core logic for high-performance apps.", "contact":"hr@corelogic.io" },
{ "title":"GIS Analyst", "company":"MapGlobal", "location":"Remote", "salary":"75k - 110k", "type":"Full Time", "skills":"ArcGIS, Python, Cartography", "description":"Analyze spatial data and create cartographic products.\nMaintain GIS databases and automation scripts.\nCollaborate with environmental research teams.", "contact":"jobs@mapglobal.net" },
{ "title":"RPA Developer", "company":"BotMakers", "location":"Hyderabad, India", "salary":"80k - 120k", "type":"Full Time", "skills":"UiPath, Blue Prism, Automation", "description":"Develop robotic process automation bots.\nOptimize business workflows through automation.\nEnsure bot stability and error handling.", "contact":"apply@botmakers.com" },
{ "title":"Linux Kernel Engineer", "company":"OpenOS Labs", "location":"Remote", "salary":"140k - 200k", "type":"Full Time", "skills":"C, Kernel Development, Embedded Linux", "description":"Develop and patch Linux kernel drivers.\nOptimize system performance for embedded hardware.\nCollaborate with the open-source community.", "contact":"dev@openos.org" },
{ "title":"Quantitative Analyst", "company":"FinTechLabs", "location":"Mumbai, India", "salary":"130k - 190k", "type":"Full Time", "skills":"R, Python, Financial Modeling", "description":"Develop mathematical models for financial trading.\nAnalyze market trends and risk factors.\nImplement algorithmic trading strategies.", "contact":"hr@fintechlabs.com" },
{ "title":"Hardware Design Engineer", "company":"CircuitPro", "location":"Pune, India", "salary":"100k - 150k", "type":"Full Time", "skills":"Verilog, PCB Design, FPGA", "description":"Design and test digital circuit systems.\nDevelop FPGA firmware and PCB layouts.\nEnsure hardware reliability and performance.", "contact":"careers@circuitpro.io" },
{ "title":"Performance Engineer", "company":"LoadTest Solutions", "location":"Chennai, India", "salary":"90k - 130k", "type":"Full Time", "skills":"JMeter, Python, Analysis", "description":"Conduct load and stress testing on web apps.\nAnalyze bottlenecks and suggest optimizations.\nEnsure application scalability and uptime.", "contact":"jobs@loadtest.io" },
{ "title":"Hadoop Administrator", "company":"ClusterTech", "location":"Bangalore, India", "salary":"110k - 160k", "type":"Full Time", "skills":"Hadoop, Big Data Administration", "description":"Manage and maintain massive Hadoop clusters.\nEnsure data availability and system security.\nOptimize cluster performance and resource usage.", "contact":"admin@clustertech.net" },
{ "title":"Vulnerability Researcher", "company":"ZeroDay Labs", "location":"Remote", "salary":"150k - 220k", "type":"Full Time", "skills":"Reverse Engineering, Exploit Dev", "description":"Research zero-day vulnerabilities in software.\nDevelop proof-of-concept exploits for security testing.\nCollaborate with bug bounty programs.", "contact":"research@zerodaylabs.com" },
{ "title":"ETL Specialist", "company":"DataFlow Labs", "location":"Hyderabad, India", "salary":"85k - 120k", "type":"Full Time", "skills":"Informatica, SQL, Data Integration", "description":"Design and implement data integration workflows.\nManage ETL processes and data quality audits.\nOptimize data movement across systems.", "contact":"hr@dataflow.io" },
{ "title":"Network Security Architect", "company":"NetSecure Solutions", "location":"Mumbai, India", "salary":"140k - 190k", "type":"Full Time", "skills":"Firewalls, VPN, IPSec", "description":"Design secure enterprise network architectures.\nImplement robust firewall and VPN protocols.\nMonitor network traffic for anomalies.", "contact":"careers@netsecure.io" }
];


async function populateCustomJobs() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB...");

        // 1. Clear jobs
        console.log("Removing all existing jobs...");
        await JobDetail.deleteMany({});
        console.log("All existing jobs cleared.");

        // 2. Clear old users and profiles
        await User.deleteMany({ userid: { $in: ['userofa12345@gmail.com', 'userofb12345@gmail.com'] } });
        await Profile.deleteMany({ email: { $in: ['userofa12345@gmail.com', 'userofb12345@gmail.com'] } });

        // 3. Create user-1 and profile
        const hashedPw = await bcrypt.hash("12345", 10);
        const user1 = await User.create({
            userName: "user 1",
            userid: "userofa12345@gmail.com",
            password: hashedPw,
            isVerified: true
        });
        await Profile.create({
            userId: user1._id,
            name: "user 1",
            email: "userofa12345@gmail.com",
            location: "Bangalore, India",
            bio: "Recruiter for TechNova Solutions"
        });

        // 4. Create user-2 and profile
        const user2 = await User.create({
            userName: "user 2",
            userid: "userofb12345@gmail.com",
            password: hashedPw,
            isVerified: true
        });
        await Profile.create({
            userId: user2._id,
            name: "user 2",
            email: "userofb12345@gmail.com",
            location: "Hyderabad, India",
            bio: "Recruiter for SkyNet Cloud"
        });

        console.log(`Created user-1: ${user1.userid} and user-2: ${user2.userid}`);

        // Helper to map Jobs to exact past dates
        const timeframes = [
            { daysAgo: 0 },   // Past 24h
            { daysAgo: 2 },   // Past 2 Days
            { daysAgo: 7 },   // Past Week
            { daysAgo: 30 },  // Past Month
            { daysAgo: 365 }  // Past Year
        ];

        let finalJobPayloads = [];
        const now = new Date();

        // Assign 30 jobs to user-1 across 5 periods (6 jobs each)
        user1JobsRaw.forEach((job, index) => {
            const periodIndex = Math.floor(index / 6); // 0, 1, 2, 3, 4
            const frame = timeframes[periodIndex] || timeframes[4];
            
            const jobDate = new Date(now);
            jobDate.setDate(jobDate.getDate() - frame.daysAgo);
            jobDate.setHours(jobDate.getHours() - (index % 12));

            finalJobPayloads.push({
                ...job,
                companyContact: job.contact, // Map 'contact' from raw JSON to 'companyContact' in schema
                category: 'Engineering',
                postedby: user1._id.toString(),
                createdAt: jobDate,
                updatedAt: jobDate
            });
        });

        // Assign 30 jobs to user-2 across 5 periods (6 jobs each)
        user2JobsRaw.forEach((job, index) => {
            const periodIndex = Math.floor(index / 6); 
            const frame = timeframes[periodIndex] || timeframes[4];
            
            const jobDate = new Date(now);
            jobDate.setDate(jobDate.getDate() - frame.daysAgo);
            jobDate.setHours(jobDate.getHours() - (index % 12));

            finalJobPayloads.push({
                ...job,
                companyContact: job.contact, // Map 'contact' from raw JSON to 'companyContact' in schema
                category: 'Engineering',
                postedby: user2._id.toString(),
                createdAt: jobDate,
                updatedAt: jobDate
            });
        });

        console.log(`Inserting ${finalJobPayloads.length} explicit jobs...`);
        await JobDetail.insertMany(finalJobPayloads);
        
        // Count verified jobs in DB
        const user1Count = await JobDetail.countDocuments({ postedby: user1._id.toString() });
        const user2Count = await JobDetail.countDocuments({ postedby: user2._id.toString() });
        
        console.log(`VERIFICATION: User 1 Jobs: ${user1Count}, User 2 Jobs: ${user2Count}`);
        console.log("SUCCESS: 60 custom jobs inserted perfectly partitioned between user-1 (userofa) and user-2 (useerofb).");
        console.log("User 2 has completely different jobs (Golang, Kotlin, Ruby, etc.)");

    } catch (err) {
        console.error("Error populating custom jobs:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

populateCustomJobs();
