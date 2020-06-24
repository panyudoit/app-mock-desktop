import { ipcRenderer, webFrame } from "electron"
import { Component, Watch } from "vue-property-decorator"
import VirtualList from "vue-virtual-scroll-list"
import { namespace } from "vuex-class"
import {
  CMDCode,
  ProxyRequestRecord,
  ProxyStatRecord
} from "../../model/DataModels"
import AbstractPage from "./AbstractPage.vue"
import ProxyRecordSnap from "./components/ProxyRecordSnap.vue"
import ProxyRequestDetail from "./components/ProxyRequestDetail.vue"
import ProxyStatDetail from "./components/ProxyStatDetail.vue"

const ProxyRecords = namespace("ProxyRecords");

@Component({
  name: "Proxy",
  components: {
    VirtualList,
    ProxyRequestDetail,
    ProxyStatDetail,
  },
})
export default class Proxy extends AbstractPage {

  public proxyRecordSnap: any = ProxyRecordSnap;

  @ProxyRecords.State("records")
  private records: Array<ProxyRequestRecord | ProxyStatRecord>;

  @ProxyRecords.State("curRecord")
  private curRecord: ProxyRequestRecord | ProxyStatRecord;

  @ProxyRecords.Mutation("setProxyTypes")
  private setProxyTypes: Function;

  @ProxyRecords.Mutation("setCurRecord")
  private setCurRecord!: Function;

  @ProxyRecords.Mutation("clearRecords")
  private clearRecords!: Function;

  public $refs!: {
    wrapper: any;
    bottom: any;
  };

  filterTypes: string[] = [String(CMDCode.REQUEST)];
  mockDelay: number = null;
  isDelay: boolean = false;
  filterInput: string = null;
  activeTab: string = "0";

  throttleRecords: Array<ProxyRequestRecord | ProxyStatRecord> = null;
  filtedRecords: Array<ProxyRequestRecord | ProxyStatRecord> = [];

  scroll: any = null;

  mounted() {
    this.updateNavBarConfig({
      title: "代理",
      leftItem: false,
      rightItem: false,
    });
    this.setProxyTypes(this.filterTypes);
  }

  destroyed() {
    this.clearProxyRecrods();
  }

  public clearProxyRecrods(): void {
    this.filtedRecords = [];
    this.clearRecords();
    this.setCurRecord(null);
    webFrame.clearCache();
  }

  private siftRecords(): void {
    this.filtedRecords = this.records.filter(
      (item: ProxyRequestRecord | ProxyStatRecord) => {

        if (item.type ==CMDCode.REQUEST_START|| item.type == CMDCode.REQUEST_END) {
          if (this.filterInput == null) return true;
          return (<ProxyRequestRecord>item).url.indexOf(this.filterInput) !== -1;
        }else {
          return true;
        }
      }
    );
  }

  @Watch("isDelay")
  private onSetDelayChanged(): void {
    if (!this.isDelay) this.mockDelay = null;
    ipcRenderer.send("set-proxy-delay", {
      isDelay: this.isDelay,
      delay: this.mockDelay,
    });
  }

  @Watch("records")
  private onRecordsChanged(): void {
    this.siftRecords();
  }

  @Watch("filterInput")
  private onFilterChanged(): void {
    this.siftRecords();
  }

  @Watch("filterTypes")
  private onProxyTypesChanged(): void {
    this.setProxyTypes(this.filterTypes);
  }
}
