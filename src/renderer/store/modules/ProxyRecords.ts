import Vue from "vue";
import { ActionTree, Commit, GetterTree, MutationTree } from "vuex";
import {
  CMDCode,
  ProxyRequestRecord,
  ProxyStatRecord,
} from "../../../model/DataModels";
import { ProxyRecordState } from "../types";

const state: ProxyRecordState = {
  records: [],
  curRecord: null,
};

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
  updateProxyRequestState(state, record: ProxyRequestRecord) {
    if (record.type == CMDCode.REQUEST_START) {
      if (state.records.length > 40) {
        state.records.splice(0, 10);
      }
      try {
        record._idx = record.id + "";
        state.records.unshift(record);
      } catch (err) {
        console.error(err);
      }

      let isExist = false;

      if (state.curRecord == null) return;

      for (let i = 0; i < state.records.length; ++i) {
        if (state.records[i].id === state.curRecord.id) {
          isExist = true;
          break;
        }
      }

      if (!isExist) state.curRecord = null;
    } else {
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
    }
  },
  addStatistics(state, obj) {
    let recordJson = {
      type: CMDCode.STATISTICS,
      id: "00000123",
      app_id: "string",
      app_version: "string",
      os: "string",
      rule: "string",
      pageId: "string",
      elementId: "string",
      event_id: "string",
      arg1: "string",
      arg2: "string",
      arg3: "string",
      args: "string",
      desc: "string",
    };
    // let record: ProxyStatRecord = plainToClass(ProxyStatRecord, recordJson, { excludeExtraneousValues: true });
    // state.records.push(record);
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
