import Message from "element-ui/packages/message";
import SockJS from "sockjs-client";
import { BizType, CMDType, PushMsg, PushMsgType, PushMsgPayload } from "../model/DataModels";


export class PushClient {
  private store: any;
  private uid: string;

  private sockjs: any;

  constructor(store: any) {
    this.store = store;
  }

  public start(host: string, uid: string): void {
    this.uid = uid;
    try {
      this.sockjs.close();
    } catch (err) { }
    this.sockjs = new SockJS(`${host}/echo`);
    this.sockjs.onopen = () => { this.register(uid); }
    this.sockjs.onmessage = (e: any) => { this.handleMsg(e.data); }
  }

  public close() {
    this.sockjs.close();
  }

  public send(data: PushMsg<any>): void {
    data.from = this.uid;
    this.sockjs.send(JSON.stringify(data));
  }

  private register(uid: string): void {
    let msg: PushMsg<any> = {
      type: PushMsgType.CMD,
      from: this.sockjs.id,
      payload: {
        type: CMDType.REGISTER,
        content: uid
      }
    };
    this.sockjs.send(JSON.stringify(msg));
  }

  private handleMsg(data: any): void {
    let msg: PushMsg<any> = JSON.parse(data);
    switch (msg.type) {
      case PushMsgType.CMD: {
        this.handleCMD(msg.payload);
        break;
      }
      case PushMsgType.TXT: {
        switch (msg.payload.type) {
          case BizType.Proxy: {
            this.store.commit("ProxyRecords/updateProxyRecords", msg.payload.content);
            break;
          }
          case BizType.IM: {
            Message({ message: msg.payload.content, type: "success" });
            break;
          }
        }
        break;
      }

      default:
        Message({ message: "unhandled code:" + msg.type, type: "warning" });
    }
  }

  private handleCMD(msg: PushMsgPayload<any>) {
    switch (msg.type) {
      case CMDType.REGISTER:
        this.store.commit("updateShowQrCodeDialog", false);
        Message({ message: "设备[" + msg.content + "]注册成功", type: "success" });
        break;
      case CMDType.KICKDOWN:
        Message({ message: "被踢下线", type: "error" });
        window.close();
        break;
    }
  }
}
