import { Connection, Request } from "tedious";
import {} from "dotenv/config";
import cors from "cors";
import Router from "express";
import express from "express";
var app = express();
const router = Router();

app.use(cors());

const config = {
  server: process.env.SERVER, // Update me
  authentication: {
    type: "default",
    options: {
      userName: process.env.USER, // Update me
      password: process.env.PASSWORD, // Update me
    },
  },
  options: {
    encrypt: true, // If you are on Microsoft Azure, you need encryption
    database: process.env.DB, // Update me
  },
};

router.get("/api/connection", function (req, res) {
  connect(req, res);
});

router.post("/api/connection", function (req, res) {
  connect(req, res);
});

function connect(req, res) {
  console.log("Successful connection");
  const connection = new Connection(config);
  connection.on("connect", function (err) {
    if (err) {
      res.json({ success: false, result: err });
      console.log("Error: ", err);
    } else {
      if (req !== undefined) {
        if (req.method === "GET") {
          executeStatementGET(req, res, connection);
        } else if (req.method === "POST") {
          executeStatementPOST(req, res, connection);
        }
      }
    }
  });

  connection.connect();
}

function executeStatementPOST(req, res, connection) {
  try {
    let error = false;
    const request = new Request(req.body.params.command, function (err) {
      if (err) {
        console.log(err);
        error = true;
        res.json({ success: false, result: err });
      }
    });

    request.on("requestCompleted", function (rowCount, more) {
      if (!error) {
        res.json({ success: true, result: null });
      }
      connection.close();
    });

    connection.execSql(request);
  } catch (e) {
    console.error(e);
  }
}

function executeStatementGET(req, res, connection) {
  try {
    const request = new Request(req.query.command, function (err) {
      if (err) {
        res.json({ success: false, error: err });
        console.log(err);
      }
    });

    let result = "";

    request.on("row", function (columns) {
      columns.forEach(function (column) {
        if (column.value === null) {
          console.log("NULL");
        } else {
          result += column.value + "";
        }
      });
    });

    request.on("requestCompleted", function (rowCount, more) {
      res.json({ success: true, result: result });

      connection.close();
    });

    connection.execSql(request);
  } catch (e) {
    console.error(e);
  }
}

app.use(router);
const PORT = process.env.PORT || 3030;

app.listen(PORT, function () {
  console.log(`Server is running on port ${PORT}`);
});
