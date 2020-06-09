define([
  'dojo/_base/declare', './GridContainer', 'dojo/on',
  './TSV_CSV_Grid', 'dijit/popup', 'dojo/_base/lang',
  'dijit/TooltipDialog', 'dojo/topic', 'dojo/dom-construct'
], function (
  declare, GridContainer, on,
  TSV_CSV_Grid, popup, lang,
  TooltipDialog, Topic, domConstruct
) {

  var dfc = '<div>Download Table As...</div><div class="wsActionTooltip" rel="text/tsv">Text</div><div class="wsActi    onTooltip" rel="text/csv">CSV</div><div class="wsActionTooltip" rel="application/vnd.openxmlformats">Excel</div>';

  var downloadTT = new TooltipDialog({
    content: dfc,
    onMouseLeave: function() {
      popup.close(downloadTT);
    }
  });

  var tsvGrid = new TSV_CSV_Grid ({
    region: 'center',
  }); 

  return declare([GridContainer], {
    gridCtor: tsvGrid,
    containerType: 'csvFeature',
    enableAnchorButton: true,
    maxDownloadSize: 25000,
    setColumns: function (newColumns) {
      var gridColumns = newColumns;       
      //TSV_CSV_Grid.setColumns(gridColumns);
      //tsvGrid.setColumns(gridColumns);
    },
    setData: function(newData) {
      tsvGrid.setData(newData);
    },
    setStore: function (tsvStore) {
      tsvGrid.setStore (tsvStore);
    },
    containerActions: GridContainer.prototype.containerActions.concat([
    [
      'DownloadTable',
      'fa icon-download fa-2x',
      {
        label: 'DOWNLOAD',
        multiple: false,
        validTypes: ['*'],
        tooltip: 'Download Table',
        tooltipDialog: downloadTT
      },

      function () {
        var _self = this;

        var totalRows = _self.grid.totalRows;
        if (totalRows > _self.maxDownloadSize) { 
          downloadTT.set('content', 'This table exceeds the maximum download size of ' + _self.maxDownloadSize);
        } else {
          downloadTT.set('content', dfc);
        
          on(downloadTT.domNode, 'div:click', function(evt) {
            var rel = evt.target.attributes.rel.value;
            var dataType = _self.dataModel;
            var currentQuery = _self.grid.get('query');

            var query = currentQuery + '&sort(+' + _self.primaryKey + ')&limit(' + _self.maxDownloadSize + ')';

            var baseUrl = baseUrl + dataType + '/?';

            if (window.App.authorizationToken) {
              baseUrl = baseUrl + '&http_authorization' + encodeURIComponent(window.App.authorizationToken);
            }

            baseUrl = baseUrl + '&http_accept=' + rel + '&http_download=true';
            var form = domConstruct.create('form', {
              style: 'display: none;',
              id: 'downloadForm',
              enctype: 'application/x-www-form-urlencoded',
              name: 'downloadForm',
              method: 'post',
              action: baseUrl
            }, _self.domNode);
            domConstruct.create('input', {
              type: 'hidden',
              value: encodeURIComponent(query),
              name: 'rq1'
            }, form);
            form.submit();

            popup.close(downloadTT);
          });
        }

        popup.open({
          popup: this.containerActionBar._actions.DownloadTable.options.tooltipDialog,
          around: this.containerActionBar._actions.DownloadTable.button,
          orient: ['below']
        });
      },
      true,
      'left'
    ],


  ]),

  //gridCTor: tsvGrid  
  });

});

