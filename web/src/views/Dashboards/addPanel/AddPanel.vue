<!-- Copyright 2022 Zinc Labs Inc. and Contributors

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http:www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License. 
-->

<!-- eslint-disable vue/no-unused-components -->
<template>
  <div style="height: calc(100vh - 57px); overflow-y: auto" class="scroll">
    <div class="flex justify-between items-center q-pa-sm">
      <div class="q-table__title q-mr-md">
        {{ editMode ? t("panel.editPanel") : t("panel.addPanel") }}
      </div>
      <div class="flex items-baseline q-gutter-sm">
        <date-time @date-change="updateDateTime" />
        <q-btn
          class="q-ml-md q-mb-xs text-bold"
          outline
          padding="sm lg"
          color="red"
          no-caps
          :label="t('panel.discard')"
          @click="goBackToDashboardList"
        />
        <q-btn
          class="q-ml-md q-mb-xs text-bold"
          outline
          padding="sm lg"
          color="white"
          text-color="black"
          no-caps
          :label="t('panel.save')"
          @click="savePanelOnClick"
        />
        <q-btn
          class="q-ml-md q-mb-xs text-bold no-border"
          padding="sm lg"
          color="secondary"
          no-caps
          :label="t('panel.apply')"
          @click="runQuery"
        />
      </div>
    </div>
    <q-separator></q-separator>
    <div class="row" style="height: calc(100vh - 118px); overflow-y: auto">
      <div
        class="col"
        style="overflow: hidden; min-width: 80px; max-width: 80px"
      >
        <ChartSelection
          v-model:selectedChartType="dashboardPanelData.data.type"
        />
      </div>
      <q-separator vertical />
      <div class="col" style="width: 100%;">
				<q-splitter
					v-model="dashboardPanelData.layout.splitter"
					style="width: 100%"
				>
					<template #before>
						<div class="col scroll " style="height: calc(100vh - 118px); overflow-y: auto;">
							<GetFields />
						</div>
					</template>
					<template #separator>
						<q-avatar
						color="primary"
						text-color="white"
						size="20px"
						icon="drag_indicator"
						style="top: 10px"
						/>
					</template>
					<template #after>
						<div class="row" style="height: calc(100vh - 118px); overflow-y: auto; ">
							<div class="col scroll " style="height:100%; min-width: 250px; max-width: 250px;">
								<Layout/>
							</div>
							<q-separator vertical />
							<div class="col scroll " style="height:100%">
								<SearchBar />
								<q-separator />
								<ChartRender :data="chartData" :selectedTimeDate="dashboardPanelData.meta.dateTime"/>
							</div>
						</div>
					</template>
				</q-splitter>
			</div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  toRaw,
  onActivated,
  nextTick,
  watch
} from "vue";
import ChartSelection from "../../../components/dashboards/addPanel/ChartSelection.vue";
import GetFields from "../../../components/dashboards/addPanel/GetFields.vue";
import { useQuasar, date } from "quasar";

import { useI18n } from "vue-i18n";
import {
  addPanel,
  getConsumableDateTime,
  getPanel,
  updatePanel,
} from "../../../utils/commons";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import Layout from "../../../components/dashboards/addPanel/Layout.vue";
import SearchBar from "../../../components/dashboards/SearchBar.vue";
import useDashboardPanelData from "../../../composables/useDashboardPanel";
import DateTime from "../../../components/DateTime.vue";
import ChartRender from "../../../components/dashboards/addPanel/ChartRender.vue";

export default defineComponent({
  name: "AddPanel",
  components: {
    ChartSelection,
    GetFields,
    Layout,
    SearchBar,
    DateTime,
    ChartRender,
  },
  setup() {
    // This will be used to copy the chart data to the chart renderer component
    // This will deep copy the data object without reactivity and pass it on to the chart renderer
    const chartData = ref({});
    const $q = useQuasar();
    const { t } = useI18n();
    const router = useRouter();
    const route = useRoute();
    const store = useStore();
    const { dashboardPanelData, resetDashboardPanelData } =
      useDashboardPanelData();
    const editMode = ref(false);

    onActivated(async () => {
      // todo check for the edit more
      if (route.query.panelId) {
        editMode.value = true;
        const panelData = await getPanel(
          store,
          route.query.dashboard,
          route.query.panelId
        );
        // console.log("panel data", panelData);
        Object.assign(dashboardPanelData.data, panelData);
        chartData.value = JSON.parse(JSON.stringify(dashboardPanelData.data));
      } else {
        editMode.value = false;
        resetDashboardPanelData();
        chartData.value = {};
      }
    });

    let list = computed(function () {
      return [toRaw(store.state.currentSelectedDashboard)];
    });

    const currentDashboard = toRaw(store.state.currentSelectedDashboard);

    const getDashboard = () => {
      return currentDashboard.dashboardId;
    };

    const currentXLabel = computed(()=> {
      return dashboardPanelData.data.type == 'table' ? 'First Column' :dashboardPanelData.data.type == 'h-bar' ? 'Y-Axis' :  'X-Axis'
    })

    const currentYLabel = computed(()=> {
      return dashboardPanelData.data.type == 'table' ? 'Other Columns' :dashboardPanelData.data.type == 'h-bar' ? 'X-Axis' :  'Y-Axis'
    })

    watch(()=> dashboardPanelData.data.type, ()=>{
      chartData.value = JSON.parse(JSON.stringify(dashboardPanelData.data));
		})

    const runQuery = () => {
      // console.log("query change detected to run");
      if(!isValid(true)){
        return
      }
      // copy the data object excluding the reactivity
      chartData.value = JSON.parse(JSON.stringify(dashboardPanelData.data));
    };

    const updateDateTime = (value: object) => {
      dashboardPanelData.meta.dateTime = getConsumableDateTime(value);
    };
    const goBack = () => {
      return router.push({
        path: "/dashboards/view",
        query: { dashboard: route.query.dashboard },
      });
    };

    //validate the data
    const isValid = (onlyChart = false) => {
      const error = []
      const dashboardData = dashboardPanelData

      // check for at least 1 x axis
      if(!dashboardData.data.fields.x.length){
        error.push(`Please add at least one field in ${currentXLabel.value}`)
      }

      // check for at least 1 y axis
      if(!dashboardData.data.fields.y.length){
        error.push(`Please add at least one field in ${currentYLabel.value}`)
      }

      // for pie, make sure only 1 y axis is there
      if(dashboardData.data.type == "pie" && dashboardData.data.fields.y.length > 1 ){
        error.push("You can add only one field in the Y-Axis for pie chart")
      }

      // check if aggregation function is selected or not
      const aggregationFunctionError = dashboardData.data.fields.y.filter((it:any) => (it.aggregationFunction == null || it.aggregationFunction == ''))
      if(dashboardData.data.fields.y.length && aggregationFunctionError.length){
        error.push(...aggregationFunctionError.map((it:any) => `${currentYLabel.value}: ${it.column}: Aggregation function required`))
      }

      // check if labels are there for y axis items
      const labelError = dashboardData.data.fields.y.filter((it:any) => (it.label == null || it.label == ''))
      if(dashboardData.data.fields.y.length && labelError.length){
        error.push(...labelError.map((it:any) => `${currentYLabel.value}: ${it.column}: Label required`))
      }

      // check if name of panel is there
      if(!onlyChart) {
        if(dashboardData.data.config.title == null || dashboardData.data.config.title == '' ){
          error.push("Name of Panel is required")
        }
      }

      // if there are filters
      if(dashboardData.data.fields.filter.length){

        // check if at least 1 item from the list is selected
        const listFilterError = dashboardData.data.fields.filter.filter((it:any) => ((it.type == "list" && !it.values?.length)))
        if(listFilterError.length){
          error.push(...listFilterError.map((it:any) => `Filter: ${it.column}: Select at least 1 item from the list`))
        }

        // check if condition operator is selected
        const conditionFilterError = dashboardData.data.fields.filter.filter((it:any) => (it.type == "condition" && it.operator == null))
        if(conditionFilterError.length){
          error.push(...conditionFilterError.map((it:any) => `Filter: ${it.column}: Operator selection required`))
        }

        // check if condition value is selected
        const conditionValueFilterError = dashboardData.data.fields.filter.filter((it:any) => (it.type == "condition" && (it.value == null || it.value == '')))
        if(conditionValueFilterError.length){
          error.push(...conditionValueFilterError.map((it:any) => `Filter: ${it.column}: Condition value required`))
        }
       
      }

      // check if query syntax is valid
      if(dashboardData.data.customQuery && dashboardData.meta.errors.queryErrors.length){
        error.push("Please add valid query syntax")
      }

      // check if field selection is from the custom query fields when the custom query mode is ON
      if(dashboardData.data.customQuery){

        // console.log("-data-",dashboardPanelData.data.fields.x.filter((it:any) => !dashboardPanelData.meta.stream.customQueryFields.find((i:any) => i.name == it.column)) );
       
        const customQueryXFieldError = dashboardPanelData.data.fields.x.filter((it:any) => !dashboardPanelData.meta.stream.customQueryFields.find((i:any) => i.name == it.column))
        if(customQueryXFieldError.length){
          error.push(...customQueryXFieldError.map((it:any) => `Please update X-Axis Selection. Current X-Axis field ${it.column} is invalid`))
        }

        const customQueryYFieldError = dashboardPanelData.data.fields.y.filter((it:any) => !dashboardPanelData.meta.stream.customQueryFields.find((i:any) => i.name == it.column))
        if(customQueryYFieldError.length){
          error.push(...customQueryYFieldError.map((it:any) => `Please update Y-Axis Selection. Current Y-Axis field ${it.column} is invalid`))
        }

      } else {
        // check if field selection is from the selected stream fields when the custom query mode is OFF
        const customQueryXFieldError = dashboardPanelData.data.fields.x.filter((it:any) => !dashboardPanelData.meta.stream.selectedStreamFields.find((i:any) => i.name == it.column))
        if(customQueryXFieldError.length){
          error.push(...customQueryXFieldError.map((it:any) => `Please update X-Axis Selection. Current X-Axis field ${it.column} is invalid`))
        }

        const customQueryYFieldError = dashboardPanelData.data.fields.y.filter((it:any) => !dashboardPanelData.meta.stream.selectedStreamFields.find((i:any) => i.name == it.column))
        if(customQueryYFieldError.length){
          error.push(...customQueryYFieldError.map((it:any) => `Please update Y-Axis Selection. Current Y-Axis field ${it.column} is invalid`))
        }
      }
        
      // show all the errors
      for (let index = 0; index < error.length; index++) {
        $q.notify({
          type: "negative",
          message: error[index],
          timeout: 5000,
        });
      }
     
      if(error.length){
        return false
      }else{
        return true
      }

    }

    const savePanelChangesToDashboard = async (dashId: string) => {
      if(!isValid()){
        return
      }
      if (editMode.value) {
        await updatePanel(
          store,
          dashId,
          JSON.parse(JSON.stringify(dashboardPanelData.data))
        );
      } else {
        const panelId =
          "Panel_ID" + Math.floor(Math.random() * (99999 - 10 + 1)) + 10;

        dashboardPanelData.data.id = panelId;
        await addPanel(
          store,
          dashId,
          JSON.parse(JSON.stringify(dashboardPanelData.data))
        );
      }

      await nextTick();
      return router.push({
        path: "/dashboards/view",
        query: { dashboard: dashId },
      });
    };

    return {
      t,
      updateDateTime,
      goBack,
      savePanelChangesToDashboard,
      runQuery,
      getDashboard,
      currentDashboard,
      list,
      dashboardPanelData,
      chartData,
      editMode,
    };
  },
  methods: {
    goBackToDashboardList(evt: any, row: any) {
      this.goBack();
    },
    savePanelOnClick() {
      const dashboardId = this.$route.query.dashboard + "";
      this.savePanelChangesToDashboard(dashboardId);
    },
  },
});
</script>

<style lang="sass" scoped>
</style>