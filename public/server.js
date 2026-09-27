const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------------------------------------
// DATA STORAGE
// --------------------------------------------------

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "database.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
        farmers: [],
        services: [],
        harvests: [],
        experts: [],
        notifications: []
    };

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(initialData, null, 2)
    );
}

function readDB() {
    return JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
    );
}

function writeDB(data) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 2)
    );
}

function id() {
    return Date.now().toString();
}


// --------------------------------------------------
// FRONTEND
// --------------------------------------------------

app.use(express.static(path.join(__dirname, "public")));


// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "Agri Cluster backend is running",
        time: new Date().toISOString()
    });

});


// --------------------------------------------------
// FARMER PROFILE
// --------------------------------------------------

app.get("/api/farmer", (req, res) => {

    const db = readDB();

    let farmer = db.farmers[0];

    if (!farmer) {

        farmer = {
            id: id(),
            name: "Ravi",
            location: "Chamarajanagara, Karnataka",
            land: "1 acre",
            crop: "Tomato",
            soil: "Red soil",
            water: "Moderate",
            electricity: "Part-time",
            investment: 75000
        };

        db.farmers.push(farmer);
        writeDB(db);
    }

    res.json({
        success: true,
        farmer
    });

});


app.post("/api/farmer", (req, res) => {

    const db = readDB();

    const farmer = {
        id: id(),
        name: req.body.name || "Ravi",
        location: req.body.location || "",
        land: req.body.land || "",
        crop: req.body.crop || "",
        soil: req.body.soil || "",
        water: req.body.water || "",
        electricity: req.body.electricity || "",
        investment: Number(req.body.investment || 0),
        createdAt: new Date().toISOString()
    };

    db.farmers.push(farmer);

    writeDB(db);

    res.json({
        success: true,
        message: "Farmer profile saved",
        farmer
    });

});


// --------------------------------------------------
// FARM ANALYSIS
// --------------------------------------------------

app.post("/api/analyse", (req, res) => {

    const {
        soil,
        water,
        land,
        investment
    } = req.body;

    let score = 70;

    if (water === "Moderate") score += 5;
    if (water === "High") score += 10;

    if (soil === "Red soil") score += 5;

    if (Number(investment) >= 50000) {
        score += 5;
    }

    if (Number(land) >= 1) {
        score += 2;
    }

    if (score > 98) score = 98;

    const methods = [

        {
            name: "Drip Irrigation",
            icon: "💧",
            suitability: "High",
            reason: "Can help deliver water closer to the crop root zone."
        },

        {
            name: "Natural / Biological Inputs",
            icon: "🌿",
            suitability: "Explore",
            reason: "Can be considered with proper crop and pest diagnosis."
        },

        {
            name: "Integrated Farming",
            icon: "🌳",
            suitability: "Explore",
            reason: "May improve diversification and resource utilisation."
        }

    ];

    res.json({
        success: true,
        score,
        methods
    });

});


// --------------------------------------------------
// FARMING METHODS
// --------------------------------------------------

app.get("/api/methods", (req, res) => {

    res.json({
        success: true,

        methods: [

            {
                id: 1,
                name: "Drip Irrigation",
                icon: "💧",
                water: "Low-Medium",
                investment: "Medium",
                skill: "Medium",
                description:
                    "Controlled irrigation close to crop root zones."
            },

            {
                id: 2,
                name: "Natural Input Farming",
                icon: "🌿",
                water: "Medium",
                investment: "Low-Medium",
                skill: "Medium",
                description:
                    "Explore compost, bio-inputs and biological crop protection."
            },

            {
                id: 3,
                name: "Agroforestry",
                icon: "🌳",
                water: "Medium",
                investment: "Medium",
                skill: "Medium",
                description:
                    "Combines suitable trees and crops where appropriate."
            },

            {
                id: 4,
                name: "Integrated Farming",
                icon: "♻️",
                water: "Variable",
                investment: "Variable",
                skill: "High",
                description:
                    "Combines compatible farming activities."
            }

        ]
    });

});


// --------------------------------------------------
// INVESTMENT
// --------------------------------------------------

app.post("/api/investment", (req, res) => {

    const amount = Number(req.body.amount || 0);

    const allocation = {

        inputs: Math.round(amount * 0.24),

        irrigation: Math.round(amount * 0.27),

        technology: Math.round(amount * 0.16),

        labour: Math.round(amount * 0.20),

        contingency: Math.round(amount * 0.13)

    };

    res.json({
        success: true,
        amount,
        allocation
    });

});


// --------------------------------------------------
// SERVICES
// --------------------------------------------------

app.get("/api/services", (req, res) => {

    res.json({
        success: true,

        services: [

            {
                id: "drone",
                name: "Drone Service",
                icon: "🚁",
                price: "From ₹800 / visit"
            },

            {
                id: "machinery",
                name: "Farm Machinery",
                icon: "🚜",
                price: "From ₹1,200 / hour"
            },

            {
                id: "soil",
                name: "Soil Testing",
                icon: "🧪",
                price: "From ₹350"
            },

            {
                id: "irrigation",
                name: "Irrigation Service",
                icon: "💧",
                price: "Quotation"
            },

            {
                id: "expert",
                name: "Farm Expert",
                icon: "👨‍🔬",
                price: "Chat / Visit"
            },

            {
                id: "transport",
                name: "Farm Transport",
                icon: "🚚",
                price: "Request vehicle"
            }

        ]
    });

});


app.post("/api/services", (req, res) => {

    const db = readDB();

    const request = {

        id: id(),

        farmerName:
            req.body.farmerName || "Ravi",

        service:
            req.body.service || "Farm Service",

        location:
            req.body.location || "Chamarajanagara",

        status: "Requested",

        createdAt:
            new Date().toISOString()

    };

    db.services.push(request);

    db.notifications.push({

        id: id(),

        message:
            `${request.service} request created`,

        type: "service",

        createdAt:
            new Date().toISOString()

    });

    writeDB(db);

    res.json({
        success: true,
        message: "Service request created",
        request
    });

});


app.get("/api/services/requests", (req, res) => {

    const db = readDB();

    res.json({
        success: true,
        requests: db.services
    });

});


// --------------------------------------------------
// EXPERT SUPPORT
// --------------------------------------------------

app.post("/api/expert", (req, res) => {

    const db = readDB();

    const question = {

        id: id(),

        farmer:
            req.body.farmer || "Ravi",

        question:
            req.body.question || "",

        status: "Submitted",

        createdAt:
            new Date().toISOString()

    };

    db.experts.push(question);

    db.notifications.push({

        id: id(),

        message:
            "Your agriculture expert question was submitted",

        type: "expert",

        createdAt:
            new Date().toISOString()

    });

    writeDB(db);

    res.json({

        success: true,

        message:
            "Question submitted",

        question

    });

});


// --------------------------------------------------
// HARVEST
// --------------------------------------------------

app.post("/api/harvest", (req, res) => {

    const db = readDB();

    const harvest = {

        id: id(),

        crop:
            req.body.crop || "Tomato",

        quantity:
            Number(req.body.quantity || 0),

        price:
            Number(req.body.price || 0),

        availableDate:
            req.body.availableDate || "",

        status: "Available",

        createdAt:
            new Date().toISOString()

    };

    db.harvests.push(harvest);

    db.notifications.push({

        id: id(),

        message:
            `${harvest.crop} harvest listing created`,

        type: "harvest",

        createdAt:
            new Date().toISOString()

    });

    writeDB(db);

    res.json({

        success: true,

        message:
            "Harvest listing created",

        harvest

    });

});


app.get("/api/harvest", (req, res) => {

    const db = readDB();

    res.json({

        success: true,

        harvests: db.harvests

    });

});


// --------------------------------------------------
// MARKET
// --------------------------------------------------

app.get("/api/market", (req, res) => {

    res.json({

        success: true,

        disclaimer:
            "Demonstration market data. Production version should use verified live data.",

        markets: [

            {
                name: "Local Market",
                price: "₹18–25/kg",
                distance: "Nearby"
            },

            {
                name: "Urban Retail",
                price: "₹25–35/kg",
                distance: "Regional"
            },

            {
                name: "Wholesale",
                price: "₹16–24/kg",
                distance: "Regional"
            },

            {
                name: "Restaurants",
                price: "Buyer enquiry",
                distance: "Variable"
            }

        ]

    });

});


// --------------------------------------------------
// NOTIFICATIONS
// --------------------------------------------------

app.get("/api/notifications", (req, res) => {

    const db = readDB();

    res.json({

        success: true,

        notifications:
            db.notifications.slice(-20).reverse()

    });

});


// --------------------------------------------------
// ADMIN DASHBOARD
// --------------------------------------------------

app.get("/api/admin/dashboard", (req, res) => {

    const db = readDB();

    res.json({

        success: true,

        statistics: {

            farmers:
                db.farmers.length,

            serviceRequests:
                db.services.length,

            harvestListings:
                db.harvests.length,

            expertQuestions:
                db.experts.length,

            notifications:
                db.notifications.length

        }

    });

});


// --------------------------------------------------
// 404 API
// --------------------------------------------------

app.use("/api", (req, res) => {

    res.status(404).json({

        success: false,

        message: "API endpoint not found"

    });

});


// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {

    console.log("");
    console.log("====================================");
    console.log("       AGRI CLUSTER PLATFORM");
    console.log("====================================");
    console.log("");
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log(`Backend:  http://localhost:${PORT}/api/health`);
    console.log("");
    console.log("Server is running...");
    console.log("");

});