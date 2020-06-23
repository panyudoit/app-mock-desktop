import Vue from "vue";
import { ActionTree, Commit, GetterTree, MutationTree } from "vuex";
import {
  CMDCode,
  ProxyRequestRecord,
  ProxyStatRecord,
} from "../../../model/DataModels";
import { ProxyRecordState } from "../types";
import store from "..";

const state: ProxyRecordState = {
  records: [],
  curRecord: null,
};

const COLORS: string[] = [
  "#00a8ff",
  "#9c88ff",
  "#fbc531",
  "#4cd137",
  "#487eb0",
  "#e84118",
  "#7f8fa6",
  "#273c75",
  "#dcdde1",
  "#636e72"
];

const getters: GetterTree<ProxyRecordState, any> = {
  proxyRecords(
    state: ProxyRecordState
  ): Array<ProxyStatRecord | ProxyRequestRecord> {
    return state.records;
  },
};

// async
export const actions: ActionTree<ProxyRecordState, any> = {
  clearRecords(
    context: { commit: Commit; state: ProxyRecordState },
    data: any
  ) {
    context.commit("clearRecords");
  },
};

// sync
const mutations: MutationTree<ProxyRecordState> = {
  updateProxyRecords(state, record: ProxyRequestRecord) {
    switch (record.type) {
      case CMDCode.REQUEST_START:
      case CMDCode.STATISTICS:
        if (state.records.length > 40) {
          state.records.splice(state.records.length - 10, 10);
        }
        record._idx = record.id + "";
        record.timelineColor = COLORS[record.timestamp % 10];
        state.records.unshift(record);

        if (state.curRecord == null) return;

        let isExist = false;
        for (let i = 0; i < state.records.length; ++i) {
          if (state.records[i].id === state.curRecord.id) {
            isExist = true;
            break;
          }
        }
        if (!isExist) state.curRecord = null;
        break;
      case CMDCode.REQUEST_END:
        for (let i = 0; i < state.records.length; ++i) {
          let anchor: ProxyRequestRecord = <ProxyRequestRecord>state.records[i];
          if (anchor != null && anchor.id == record.id) {
            Vue.set(state.records[i], "isMock", record.isMock);
            Vue.set(state.records[i], "type", record.type);
            Vue.set(state.records[i], "responseHeaders", record.responseHeaders);
            Vue.set(
              state.records[i],
              "responseData",
              JSON.parse(record.responseData)
            );
            Vue.set(state.records[i], "statusCode", record.statusCode);
            Vue.set(state.records[i], "time", record.time);
            break;
          }
        }
        break;
      default:
        console.log("unsupport record type");
    }
  },
  clearRecords(state, params?: any): void {
    state.records.splice(0, state.records.length);
  },
  setCurRecord(state, params: ProxyRequestRecord) {
    state.curRecord = params;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
