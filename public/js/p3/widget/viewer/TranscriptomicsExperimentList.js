define([
	"dojo/_base/declare", "./TabViewerBase", "dojo/on",
	"dojo/dom-class", "dijit/layout/ContentPane", "dojo/dom-construct",
	"../PageGrid", "../formatter", "../TranscriptomicsExperimentGridContainer", "../TranscriptomicsComparisonGridContainer",
	 "../../util/PathJoin", "dojo/request", "dojo/_base/lang"
], function(declare, TabViewerBase, on,
			domClass, ContentPane, domConstruct,
			Grid, formatter, TranscriptomicsExperimentGridContainer, TranscriptomicsComparisonGridContainer,
			PathJoin, xhr, lang){
	return declare([TabViewerBase], {
		"baseClass": "ExperimentList",
		"disabled": false,
		"containerType": "transcriptomics_experiment_data",
		"query": null,
		paramsMap: "query",
		defaultTab: "experiments",
		perspectiveLabel: "Experiments View",
//		perspectiveIconClass: "icon-selection-GenomeList",
		perspectiveIconClass: "icon-experiments",
		total_experiments: 0,
		eids: null,
		warningContent: 'Your query returned too many results for detailed analysis.',
		_setQueryAttr: function(query){
			console.log(this.id, " _setQueryAttr: ", query, this);
			//if (!query) { console.log("GENOME LIST SKIP EMPTY QUERY: ");  return; }
			//console.log("GenomeList SetQuery: ", query, this);
			query = query; 
			this._set("query", query);
			if(!this._started){
				return; 
			}

			var _self = this;
			console.log('ExperimentList setQuery - this.query: ', this.query);

			var url = PathJoin(this.apiServiceUrl, "transcriptomics_experiment", "?" + (this.query) + "&limit(25000)"); 

			console.log("url: ", url);
			xhr.get(url, {
				headers: {
					accept: "application/solr+json",
					'X-Requested-With': null,
					'Authorization': (window.App.authorizationToken || "")
				},
				handleAs: "json"
			}).then(function(res){
				console.log(" URL: ", url);
				console.log("Get Experiment List Res: ", res);
				if(res && res.response && res.response.docs){
					var features = res.response.docs;
					if(features){
						_self._set("total_experiments", res.response.numFound);
						eids = features.map(function(x){
								return x.eid
								});
						console.log("EIDS: ", eids);
						_self._set("eids", eids);
					}
				}else{
					console.log("Invalid Response for: ", url);
				}
			}, function(err){
				console.log("Error Retreiving Experiments: ", err)
			});

		},



		onSetState: function(attr, oldVal, state){
			console.log("GenomeList onSetState()  OLD: ", oldVal, " NEW: ", state);

			// if (!state.feature_ids){
			// 	console.log("	NO Genome_IDS")
			// 	if (state.search == oldVal.search){
			// 		console.log("		Same Search")
			// 		console.log("		OLD Genome_IDS: ", oldVal.genome_ids);
			// 		this.set("state", lang.mixin({},state,{feature_ids: oldVal.genome_ids}))	
			// 		return;
			// 	}else{
			// 		this.set("query", state.search);
			// 	}
			// }else if (state.search!=oldVal.search){
			// 	console.log("SET QUERY: ", state.search);
			// 	this.set("query", state.search);
			// }

			this.set("query", state.search);

			// //console.log("this.viewer: ", this.viewer.selectedChildWidget, " call set state: ", state);
			var active = (state && state.hashParams && state.hashParams.view_tab) ? state.hashParams.view_tab : "experiments";
//			if(active == "experiments"){
//				this.setActivePanelState()
//			}

			this.inherited(arguments);
		},

/*		onSetQuery: function(attr, oldVal, query){
			query = query + "&select(eid)&limit(25000)";
			query = (query && (query.charAt(0) == "?")) ? query.substr(1) : query;
			console.log("onSetQuery query: ", query);
			xhr.post(PathJoin(this.apiServiceUrl, "transcriptomics_experiment/?"), {
				headers: {
					"accept": "application/json",
					"content-type": "application/rqlquery+x-www-form-urlencoded",
					'X-Requested-With': null,
					'Authorization': (window.App.authorizationToken || "")
				},
				postData: query,
				handleAs: "json"
			}).then(lang.hitch(this, function(eids){
				console.log("eids: ", eids);
				eids = eids.map(function(x){
					return x.eid
				});
				// console.log("EIDS: ", eids);
				this.set("eids", eids)
			}))

		},
*/

/*		onSetQuery: function(attr, oldVal, newVal){
			if (this.overview) {
				this.overview.set("content", '<div style="margin:4px;">Feature List Query: ' + decodeURIComponent(newVal) + "</div>");
			}
			// this.viewHeader.set("content", '<div style="margin:4px;">Genome List Query: ' + decodeURIComponent(newVal) + ' </div>')
			this.queryNode.innerHTML = decodeURIComponent(newVal);
		},
*/
		setActivePanelState: function(){

			var active = (this.state && this.state.hashParams && this.state.hashParams.view_tab) ? this.state.hashParams.view_tab : "experiments";
			console.log("Active: ", active, "state: ", this.state);

			var activeTab = this[active];
			
			if(!activeTab){
				console.log("ACTIVE TAB NOT FOUND: ", active);
				return;
			}

			switch(active){
				default:
					console.log("SET ACTIVE STATE for default experiments tab: ", this.state);
					activeTab.set("state", lang.mixin({},this.state,{search: this.state.search}));
					break;
			}
			console.log("Set Active State COMPLETE");
		},

		onSetEIDS: function(attr, oldVal, eids){
			console.log("set eids: ", eids);
			console.log("comparisonsGrid: ", this.comparisons);
			console.log("experiments: ", this.experiments);
			
			if(this.comparisons && eids && eids.length > 0){
				this.comparisons.set("state", lang.mixin({}, this.state, {search: "in(eid,(" + eids.join(",") + "))"}))
				//this.experiments.set("state", lang.mixin({}, this.state, {search: "in(eid,(" + eids.join(",") + "))"}))
				console.log("onSetEIDS set state: ", this.state);
				this.state.search="";
			}			
			//this.setActivePanelState();
		},


/*		onSetExperimentIds: function(attr, oldVal, genome_ids){
			this.state.taxon_ids = feature_ids;
			this.setActivePanelState();
		},

		createOverviewPanel: function(state){
			return new ContentPane({
				content: "Overview",
				title: "Overview",
				id: this.viewer.id + "_" + "overview",
				state: this.state
			});
		},
*/
		postCreate: function(){
			if(!this.state){
				this.state = {};
			}

			this.inherited(arguments);

			//this.watch("state", lang.hitch(this, "onSetState"));
			this.watch("eids", lang.hitch(this, "onSetEIDS"));

			//this.watch("query", lang.hitch(this, "onSetQuery"));
			this.watch("total_experiments", lang.hitch(this, "onSetTotalExperiments"));

			//this.overview = this.createOverviewPanel(this.state);
			this.experiments= new TranscriptomicsExperimentGridContainer({
				title: "Experiments",
				id: this.viewer.id + "_" + "experiments",
				disabled: false
			});
			
			this.comparisons = new TranscriptomicsComparisonGridContainer({
				title: "Comparisons",
				enableFilterPanel: false,
				id: this.viewer.id + "_" + "comparisons",
				disabled: false
			});

			this.viewer.addChild(this.experiments);
			this.viewer.addChild(this.comparisons);
			this.setActivePanelState();
		},
		onSetTotalExperiments: function(attr, oldVal, newVal){
			console.log("ON SET TOTAL Experiments: ", newVal);
			this.totalCountNode.innerHTML = " ( " + newVal + " Experiments) ";
			var hasDisabled = false;
		}
	});
});
