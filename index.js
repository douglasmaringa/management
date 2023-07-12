const express = require("express");
const app = express();
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const Agenda = require("agenda");
const performCronJob1 = require("./cronJobs/1minute");
const performCronJob5 = require("./cronJobs/5minute");
const performCronJob10 = require("./cronJobs/10minute");
const performCronJob30 = require("./cronJobs/30minute");
const performCronJob60 = require("./cronJobs/60minute");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Routes imports
const userRoute = require("./routes/user");
const monitorRoute = require("./routes/monitor");

async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://your-username:your-password@185.150.190.136:27017/your-database-name', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log("DB connected successfully");

    // Define Swagger options
    const swaggerOptions = {
      definition: {
        openapi: "3.0.0",
        info: {
          title: "Your API Title",
          version: "1.0.0",
          description: "API documentation for your Express server",
        },
      },
      apis: ["./routes/*.js"], // Replace with the path to your route files
    };

    // Generate Swagger specification
    const swaggerSpec = swaggerJsdoc(swaggerOptions);


    // Initialize Agenda
    const agenda1 = new Agenda({ mongo: mongoose.connection });
    const agenda5 = new Agenda({ mongo: mongoose.connection });
    const agenda10 = new Agenda({ mongo: mongoose.connection });
    const agenda30 = new Agenda({ mongo: mongoose.connection });
    const agenda60 = new Agenda({ mongo: mongoose.connection });

    // Define the job types
    agenda1.define("performCronJob1", async (job) => {
      await performCronJob1();
    });

    agenda5.define("performCronJob5", async (job) => {
      await performCronJob5();
    });

    agenda10.define("performCronJob10", async (job) => {
      await performCronJob10();
    });

    agenda30.define("performCronJob30", async (job) => {
      await performCronJob30();
    });

    agenda60.define("performCronJob60", async (job) => {
      await performCronJob60();
    });

    // Before starting the server, cancel and remove all existing jobs
    await agenda1.cancel({});
    await agenda5.cancel({});
    await agenda10.cancel({});
    await agenda30.cancel({});
    await agenda60.cancel({});

    // Start the agenda schedulers
    await agenda1.start();
    await agenda5.start();
    await agenda10.start();
    await agenda30.start();
    await agenda60.start();

    // Middleware
    app.use(express.json());
    app.use(helmet());
    app.use(morgan("common"));
    app.use(cors());

    // Initializing routes
    app.use("/api/user", userRoute);
    app.use("/api/monitor", monitorRoute);

    // Swagger UI
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Start the server
    app.listen(5000, () => {
      console.log("Server running on port 5000");
    });
  } catch (error) {
    console.error("Error starting the server:", error);
  }
}

// Start the server
startServer();
