import bodyParser from "body-parser";
import compression from "compression";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import fs from "fs";
import { createServer, Server } from "http";
import { NetworkInterfaceInfo, networkInterfaces } from "os";
import path from "path";
import { IP } from "../model/DataModels";
import ProxyService from "./ProxyService";
import PushService from "./PushService";
import WebService from "./WebService";

var nodeStatic = require('node-static');
var file = new nodeStatic.Server(`${__dirname}/public`);

const corsOptions = {
  origin: "http://localhost:9080",
  credentials: true,
  optionsSuccessStatus: 200,
};

class LocalServer {
  private serverIP: string;
  private proxyHttpPort: number;
  private proxySocketPort: number;
  private pushSocketPort: number;
  private httpServer: Server;
  private httpApp: Application;

  constructor() {
    this.serverIP = LocalServer.getLocalIPs()[0].address;
    this.proxyHttpPort = 8885;
    this.proxySocketPort = 8886;
    this.pushSocketPort = 8887;
    this.initHttpServer();
  }

  private initHttpServer(): void {
    this.httpApp = express();
    this.httpApp.use(cors(corsOptions));
    this.httpApp.use(compression());
    this.httpApp.use((req: any, resp: Response, next: any) => {
      if (/^\/burying-point\//.test(req.url)) {
        let buf = [];
        req.on("data", (data: any) => {
          buf.push(data);
        });
        req.on("end", () => {
          req.rawbody = Buffer.concat(buf);
          ProxyService.handleStatRequest(req, resp);
        });
      }
      next();
    });

    this.httpApp.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
    this.httpApp.use(bodyParser.text({ type: "application/json", limit: '50mb' }));
    this.httpApp.all("*", (req: Request, resp: Response, next: any) => {
      if (/^\/mw\//.test(req.url) || /^\/appmock\//.test(req.url)) {
        WebService.filter(req, resp);
      } else if (/^\/burying-point\//.test(req.url) || req.url == "favicon.ico") {
        resp.end();
      } else if (/^\/test\//.test(req.url)) {
        file.serve(req, resp);
        // fs.readFile(`${path.join(__dirname + "/../../dist/electron/")}index.html`, function (err, data) {
        //   resp.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': data.length });
        //   resp.write(data);
        //   resp.end();
        // });
      } else {
        ProxyService.handleRequest(req, resp);
      }
    });
  }

  private static getLocalIPs(): Array<IP> {
    let ips = [];

    for (let devName in networkInterfaces()) {
      let iface: NetworkInterfaceInfo[] = networkInterfaces()[devName];
      for (let i = 0; i < iface.length; i++) {
        let alias: NetworkInterfaceInfo = iface[i];
        if (
          alias.family === "IPv4" &&
          alias.address !== "127.0.0.1" &&
          !alias.internal
        ) {
          ips.push({
            name: devName,
            netmask: alias.netmask,
            family: alias.family,
            mac: alias.mac,
            internal: alias.internal,
            cidr: alias.cidr,
            address: alias.address,
          });
        }
      }
    }
    return ips;
  }

  public getLocalServerConfig(): {
    serverIP: string;
    proxyHttpPort: number;
    proxySocketPort: number;
    pushSocketPort: number;
    ips: IP[];
  } {
    return {
      serverIP: LocalServer.getLocalIPs()[0].address,
      proxyHttpPort: this.proxyHttpPort,
      proxySocketPort: this.proxySocketPort,
      pushSocketPort: this.pushSocketPort,
      ips: LocalServer.getLocalIPs(),
      pbFiles: ProxyService.getProtoFiles(),
    };
  }

  public updateLocalServerConfig(config: {
    serverIP: string;
    proxyHttpPort: number;
    proxySocketPort: number;
    pushSocketPort: number;
  }): void {
    if (this.serverIP != config.serverIP) {
      this.serverIP = config.serverIP;
      this.proxyHttpPort = config.proxyHttpPort;
      this.proxySocketPort = config.proxySocketPort;

      this.startProxyHttpServer();
      this.startProxySocketServer();
      this.startLocalPushServer();
    } else {
      if (this.proxyHttpPort != config.proxyHttpPort) {
        this.serverIP = config.serverIP;
        this.proxyHttpPort = config.proxyHttpPort;
        this.startProxyHttpServer();
      }

      if (this.proxySocketPort != config.proxySocketPort) {
        this.serverIP = config.serverIP;
        this.proxySocketPort = config.proxySocketPort;
        this.startProxySocketServer();
      }

      if (this.pushSocketPort != config.pushSocketPort) {
        this.serverIP = config.serverIP;
        this.pushSocketPort = config.pushSocketPort;
        this.startLocalPushServer();
      }
    }
  }

  public startProxyHttpServer(): void {
    try {
      if (this.httpServer) {
        this.httpServer.close((err?: Error) => {
          console.log(`关闭本地代理服务[${this.proxyHttpPort}]`, err);
          this.httpServer = createServer(this.httpApp).listen(
            this.proxyHttpPort,
            this.serverIP,
            () => {
              console.log(`启动本地代理Http服务[${this.proxyHttpPort}]`);
            }
          );
        });
      } else {
        this.httpServer = createServer(this.httpApp).listen(
          this.proxyHttpPort,
          this.serverIP,
          () => {
            console.log(`启动本地代理Http服务[${this.proxyHttpPort}]`);
          }
        );
      }
    } catch (err) {
      console.error("startProxyHttpServer", err);
    }
  }

  public startProxySocketServer(): void {
    try {
    } catch (err) { }
    ProxyService.initProxySocketServer(this.proxySocketPort);
  }

  public startLocalPushServer(): void {
    try {
      PushService.closeWebSocketServer(() => {
        console.log(`关闭本地推送服务`);
      });
    } catch (err) {
      console.log("startLocalPushServer", err);
    }
    PushService.initWebSocket(this.pushSocketPort);
  }
}

export default new LocalServer();
