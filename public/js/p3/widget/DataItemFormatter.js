define([
  'dojo/_base/lang', 'dojo/date/locale', 'dojo/dom-construct', 'dojo/dom-class',
  'dijit/form/Button', '../JobManager', 'dijit/TitlePane', './formatter', 'dojo/on',
  'dojo/query', '../util/PathJoin', 'dojo/request', 'dojo/when', 'dojo/NodeList-traverse'
], function (
  lang, locale, domConstruct, domClass,
  Button, JobManager, TitlePane, formatter, on,
  query, PathJoin, request, when
) {

  function renderNoInfoFound(sectionName, parent) {
    domConstruct.create('tr', {
      innerHTML: '<td></td><td class="DataItemSectionNotFound">None available</td>'
    }, parent);
  }

  function renderSectionHeader(title) {
    var tr = domConstruct.create('tr', {});
    domConstruct.create('td', {
      innerHTML: title,
      'class': 'DataItemSectionHead',
      colspan: 2
    }, tr);

    return tr;
  }

  function evaluateLink(link, value, item) {
    return (link && value !== '-' && value !== '0') ? (
      (typeof (link) == 'function') ?
        link.apply(this, [item]) :
        '<a href="' + link + value + '" target="_blank">' + String(value).split(',').join(', ') + '</a>'
    ) : value;
  }

  function renderRow(property, value) {
    var tr = domConstruct.create('tr', {});
    domConstruct.create('td', {
      'class': 'DataItemProperty',
      innerHTML: property
    }, tr);
    domConstruct.create('td', {
      'class': 'DataItemValue',
      innerHTML: value
    }, tr);

    return tr;
  }

  function renderDataTable(data) {
    var table = domConstruct.create('table', { 'class': 'p3table' });
    for (var i = 0, len = data.length; i < len; i++) {
      var k = data[i].split(':')[0],
        v = data[i].split(':')[1];

      var tr = domConstruct.create('tr', {}, table);
      domConstruct.create('td', { 'class': 'DataItemProperty', innerHTML: k }, tr);
      domConstruct.create('td', { 'class': 'DataItemValue', innerHTML: v }, tr);
    }
    return table;
  }

  function renderMultiData(label, data) {
    var table = domConstruct.create('table', { 'class': 'p3table' });
    var tr = domConstruct.create('tr', {}, table);
    domConstruct.create('td', { 'class': 'DataItemProperty', innerHTML: label }, tr);

    var ul = domConstruct.create('ul', null, tr);
    if (typeof data == 'object') {
      for (var i = 0, len = data.length; i < len; i++) {
        var val = data[i];
        domConstruct.create('li', { 'class': 'DataItemValue', innerHTML: val }, ul);
      }
    } else if (typeof data == 'string') {
      domConstruct.create('li', { 'class': 'DataItemValue', innerHTML: data }, ul);
    }

    return table;
  }

  function renderProperty(column, item, options) {
    var key = column.text;
    var label = column.name;
    var multiValued = column.multiValued || false;
    var mini = options && options.mini || false;

    if (!key || !item[key] || column.data_hide) {
      return;
    }

    if (column.isList) {
      var tr = domConstruct.create('tr', {});
      var td = domConstruct.create('td', { colspan: 2 }, tr);

      domConstruct.place(renderMultiData(label, item[key]), td);
      return tr;
    } else if (multiValued) {
      var tr = domConstruct.create('tr', {});
      var td = domConstruct.create('td', { colspan: 2 }, tr);

      domConstruct.place(renderDataTable(item[key]), td);
      return tr;
    } else if (column.type == 'date') {
      // display dates as MM/DD/YYYY, unless collection date or not parseable
      var d = new Date(item[key]);
      if (key === 'collection_date') {
        var dateStr = item[key];
      } else {
        var d = new Date(item[key]);
        if (d instanceof Date && !isNaN(d)) {
          var dateStr = (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
        } else {
          var dateStr = item[key];
        }
      }

      return renderRow(label, dateStr);
    } else if (!mini || column.mini) {
      var l = evaluateLink(column.link, item[key], item);

      // a special case for service app
      if (label == 'Service') {
        l = formatter.serviceLabel(item[key]);
      }
      return renderRow(label, l);
    }
  }


  function displayHeader(parent, label, iconClass, url, options) {
    var linkTitle = options && options.linkTitle || false;

    var titleDiv = domConstruct.create('div', {
      'class': 'DataItemHeader'
    }, parent);

    domConstruct.create('hr', {}, parent);

    // span icon
    domConstruct.create('span', { 'class': iconClass }, titleDiv);

    // span label
    domConstruct.create('span', {
      innerHTML: (linkTitle) ? lang.replace('<a href="{url}">{label}</a>', { url: url, label: label }) : label
    }, titleDiv);
  }

  function displayDetailBySections(item, sections, meta_data, parent, options) {

    var mini = options && options.mini || false;

    var table = domConstruct.create('table', {}, parent);
    var tbody = domConstruct.create('tbody', {}, table);

    sections.forEach(function (section) {
      if (!mini) {
        var header = renderSectionHeader(section);
        domConstruct.place(header, tbody);
      }

      var rowCount = 0;
      meta_data[section].forEach(function (column) {
        var row = renderProperty(column, item, options);
        if (row) {
          domConstruct.place(row, tbody);
          rowCount++;
        }
      });

      // if no data found, say so
      if (!rowCount && !mini)
      { renderNoInfoFound(section, tbody); }
    });
  }

  function displayStdoutPanels(parent, item) {
    var stpDiv = domConstruct.create('div', {}, parent);
    var stdTitle = 'Standard Output';
    var stddlg = new TitlePane({
      title: stdTitle,
      style: 'margin-bottom:5px;',
      open: false
    }, stpDiv);

    var tpDiv = domConstruct.create('div', {}, parent);
    var stderrTitle = 'Error Output';
    var dlg = new TitlePane({
      title: stderrTitle,
      open: false
    }, tpDiv);

    // add copy to clipboard button
    var icon = '<i class="icon-clipboard2 pull-right"></i>';
    var copyBtn = new Button({
      label: icon,
      style: {
        'float': 'right',
        padding: 0
      },
      onClick: function (e) {
        e.stopPropagation();
        var self = this;

        // get text
        var pane = query(self.domNode).parents('.dijitTitlePane')[0];
        var content = query('pre', pane)[0].innerText;

        // copy contents
        clipboard.copy(content);

        self.set('label', 'copied');
        setTimeout(function () {
          self.set('label', icon);
        }, 2000);
      }
    });

    // on stdout panel open
    stddlg.watch('open', function (attr, oldVal, open) {
      if (!open) {
        return;
      }

      JobManager.queryTaskDetail(item.id, true, false).then(function (detail) {
        var titleBar = query('.dijitTitlePaneTextNode',  stddlg.domNode)[0];
        domConstruct.place(copyBtn.domNode, titleBar);

        if (detail.stdout) {
          stddlg.set('content', "<pre style='overflow: scroll;'>" + detail.stdout + '</pre>');
        } else {
          stddlg.set('content', 'Unable to retreive STDOUT of this task.<br><pre>' + JSON.stringify(detail, null, 4) + '</pre>');
        }

      }, function (err) {
        stddlg.set('content', 'No standard output for this task found.<br>');
      });
    });

    // on error panel open
    dlg.watch('open', function (attr, oldVal, open) {
      if (!open) {
        return;
      }

      JobManager.queryTaskDetail(item.id, false, true).then(function (detail) {
        var titleBar = query('.dijitTitlePaneTextNode',  dlg.domNode)[0];
        domConstruct.place(copyBtn.domNode, titleBar);

        if (detail.stderr) {
          dlg.set('content', "<pre style='overflow: scroll;'>" + detail.stderr + '</pre>');
        } else {
          dlg.set('content', 'Unable to retreive STDERR of this task.<br><pre>' + JSON.stringify(detail, null, 4) + '</pre>');
        }

      }, function (err) {
        dlg.set('content', 'No standard error for this task found.<br>');
      });
    });
  }

  function displayDetail(item, columns, parent, options) {
    var table = domConstruct.create('table', {}, parent);
    var tbody = domConstruct.create('tbody', {}, table);

    columns.forEach(function (column) {
      var row = renderProperty(column, item, options);
      if (row) {
        domConstruct.place(row, tbody);
      }
    });
  }

  function displayDetailSubsystems(item, columns, parent, options) {
    var table = domConstruct.create('table', {}, parent);
    var tbody = domConstruct.create('tbody', {}, table);

    columns.forEach(function (column) {

      if (column.text === 'role_name') {
        // TODO: 1. why are we counting role_name distribution?
        // 2. this is a wrong taxon id to use (e.g. 1763 -> 1765)
        // 3. need to de-duplicate fecet query

        if (item.genome_count > 1) {

          var query = 'q=genome_id:(' + options.genome_ids.join(' OR ') + ') AND subsystem_id:("' + item.subsystem_id + '")&facet=true&facet.field=role_name&facet.mincount=1&facet.limit-1&rows=25000';
          when(request.post(PathJoin(window.App.dataAPI, '/subsystem/'), {
            handleAs: 'json',
            headers: {
              Accept: 'application/solr+json',
              'Content-Type': 'application/solrquery+x-www-form-urlencoded',
              'X-Requested-With': null,
              Authorization: (window.App.authorizationToken || '')
            },
            data: query
          }), function (response) {

            var role_list = '';
            var role_items = response.facet_counts.facet_fields.role_name;

            for (var i = 0; i < role_items.length; i += 2) {
              var role = '&#8226 ' + role_items[i] + ' <span style="font-weight: bold;">(' + role_items[i + 1] + ')</span><br>';
              role_list += role;
            }

            item.role_name = role_list;

            var row = renderProperty(column, item, options);
            if (row) {
              domConstruct.place(row, tbody);
            }
          });
        } else {
          var query = 'q=genome_id:(' + item.genome_id + ') AND subsystem_id:("' + item.subsystem_id + '")&facet=true&facet.field=role_name&facet.mincount=1&facet.limit-1&rows=25000';

          when(request.post(PathJoin(window.App.dataAPI, '/subsystem/'), {
            handleAs: 'json',
            headers: {
              Accept: 'application/solr+json',
              'Content-Type': 'application/solrquery+x-www-form-urlencoded',
              'X-Requested-With': null,
              Authorization: (window.App.authorizationToken || '')
            },
            data: query
          }), function (response) {

            var role_list = '';
            var role_items = response.facet_counts.facet_fields.role_name;

            for (var i = 0; i < role_items.length; i += 2) {
              var role = '&#8226 ' + role_items[i] + ' <span style="font-weight: bold;">(' + role_items[i + 1] + ')</span><br>';
              role_list += role;
            }

            // var role_list = role_names.join("<br>");
            item.role_name = role_list;

            var row = renderProperty(column, item, options);
            if (row) {
              domConstruct.place(row, tbody);
            }
          });
        }
      } else {
        var row = renderProperty(column, item, options);
        if (row) {
          domConstruct.place(row, tbody);
        }
      }
    });
  }

  var formatters = {
    'default': function (item, options) {
      options = options || {};

      var table = domConstruct.create('table');
      var tbody = domConstruct.create('tbody', {}, table);

      Object.keys(item).sort().forEach(function (key) {
        var tr = domConstruct.create('tr', {}, tbody);
        domConstruct.create('td', { innerHTML: key }, tr);
        domConstruct.create('td', { innerHTML: item[key] }, tr);
      }, this);

      return table;
    },

    // job_parameters: function (item, options) {
    //   function renderObject(obj, target, depth) {
    //     if (!depth) {
    //       depth = 1;
    //     }
    //     if (typeof obj == 'object') {
    //       var props = Object.keys(obj);
    //       props.forEach(function (p) {
    //         if (typeof obj[p] == 'object') {
    //           var tr = domConstruct.create('tr', {}, tbody);
    //           domConstruct.create('td', {
    //             style: { 'padding-left': (depth * 5) + 'px' },
    //             innerHTML: p,
    //             nowrap: 'nowrap'
    //           }, tr);
    //           domConstruct.create('td', {}, tr);
    //           renderObject(obj[p], tbody, depth + 1);
    //         } else {
    //           var tr = domConstruct.create('tr', {}, tbody);
    //           domConstruct.create('td', {
    //             style: { 'padding-left': (depth * 10) + 'px' },
    //             innerHTML: p,
    //             nowrap: 'nowrap'
    //           }, tr);
    //           domConstruct.create('td', { innerHTML: obj[p] }, tr);
    //         }
    //       });
    //     }
    //   }
    // },
    job_status_meta: function (item, options) {
      options = options || {};

      var columns = [{
        name: 'Service',
        text: 'app'
      }, {
        name: 'Job ID',
        text: 'id'
      }, {
        name: 'Status',
        text: 'status'
      }, {
        name: 'Submitted',
        text: 'submit_time'
      }, {
        name: 'Start',
        text: 'start_time'
      }, {
        name: 'Completed',
        text: 'completed_time'
      }, {
        name: 'Parameters',
        text: 'parameters',
        data_hide: true
      }, {
        name: '_formatterType',
        text: '_formatterType',
        data_hide: true
      }, {
        name: 'Parameters',
        text: 'parameters',
        data_hide: true
      }];

      var div = domConstruct.create('div');
      displayHeader(div, item.id, 'fa icon-flag-checkered fa-2x', '/workspace/', options);
      displayDetail(item, columns, div, options);

      displayStdoutPanels(div, item);

      return div;
    },

    feature_data: function (item, options) {
      options = options || {};

      var sectionList = ['Summary', 'Identifiers', 'Genome', 'Location', 'Sequences', 'Other'];
      var section = {};

      section.Summary = [{
        name: 'RefSeq Locus Tag',
        text: 'refseq_locus_tag',
        link: 'http://www.ncbi.nlm.nih.gov/protein/?term=',
        mini: true
      }, {
        name: 'Gene Symbol',
        text: 'gene',
        mini: true
      }, {
        name: 'Product',
        text: 'product',
        mini: true
      }, {
        name: 'Annotation',
        text: 'annotation'
      }, {
        name: 'Feature Type',
        text: 'feature_type'
      }, {
        name: 'Classifier Score',
        text: 'classifier_score'
      }, {
        name: 'Classifier Round',
        text: 'classifier_round'
      }];

      section.Identifiers = [{
        name: 'Protein ID',
        text: 'protein_id',
        link: 'http://www.ncbi.nlm.nih.gov/protein/'
      }, {
        name: 'Gene ID',
        text: 'gene_id',
        link: 'http://www.ncbi.nlm.nih.gov/gene/?term='
      }, {
        name: 'gi',
        text: 'gi'
      }, {
        name: 'PATRIC Local Family',
        text: 'plfam_id',
        link: function (obj) {
          return lang.replace(
            '<a href="/view/FeatureList/?eq(plfam_id,' + obj.plfam_id + ')#view_tab=features">' +
              obj.plfam_id +
            '</a>',
            { obj: obj }
          );
        }
      }, {
        name: 'PATRIC Global Family',
        text: 'pgfam_id',
        link: function (obj) {
          return lang.replace(
            '<a href="/view/FeatureList/?eq(pgfam_id,' + obj.pgfam_id + ')#view_tab=features">' +
              obj.pgfam_id +
            '</a>',
            { obj: obj }
          );
        }
      }];

      section.Genome = [{
        name: 'Taxon ID',
        text: 'taxon_id',
        link: '/view/Taxonomy/'
      }, {
        name: 'Genome ID',
        text: 'genome_id',
        link: '/view/Genome/'
      }, {
        name: 'Genome Name',
        text: 'genome_name',
        link: function (obj) {
          return lang.replace('<a href="/view/Genome/{obj.genome_id}">{obj.genome_name}</a>', { obj: obj });
        }
      }];

      section.Location = [{
        name: 'Accession',
        text: 'accession'
      }, {
        name: 'Start',
        text: 'start'
      }, {
        name: 'End',
        text: 'end'
      }, {
        name: 'Strand',
        text: 'strand'
      }, {
        name: 'Location',
        text: 'location',
        mini: true
      }];

      section.Sequences = [{
        name: 'NA Length',
        text: 'na_length'
      }, {
        name: 'NA Sequence',
        text: 'na_sequence_md5',
        link: function (obj) {
          return '<button onclick="window.open(\'/view/FASTA/dna/?in(feature_id,(' + obj.feature_id + '))\')">view</button>';
        }
      }, {
        name: 'AA Length',
        text: 'aa_length'
      }, {
        name: 'AA Sequence',
        text: 'aa_sequence_md5',
        link: function (obj) {
          return '<button onclick="window.open(\'/view/FASTA/protein/?in(feature_id,(' + obj.feature_id + '))\')">view</button>';
        }
      }];

      section.Other = [{
        name: 'Insert Date',
        text: 'date_inserted',
        type: 'date'
      }, {
        name: 'Last Modified',
        text: 'date_modified',
        type: 'date'
      }];

      var label = (item.patric_id) ? item.patric_id : (item.refseq_locus_tag) ? item.refseq_locus_tag : (item.protein_id) ? item.protein_id : item.feature_id;

      var div = domConstruct.create('div');
      displayHeader(div, label, 'fa icon-genome-features fa-2x', '/view/Feature/' + item.feature_id, options);

      displayDetailBySections(item, sectionList, section, div, options);

      return div;
    },

    spgene_data: function (item, options) {
      options = options || {};

      var columns = [{
        name: 'Genome Name',
        text: 'genome_name'
      }, {
        name: 'PATRIC ID',
        text: 'patric_id'
      }, {
        name: 'RefSeq Locus Tag',
        text: 'refseq_locus_tag',
        link: 'http://www.ncbi.nlm.nih.gov/gene/?term='
      }, {
        name: 'Alt Locus Tag',
        text: 'alt_locus_tag'
      }, {
        name: 'Gene',
        text: 'gene'
      }, {
        name: 'Product',
        text: 'product'
      }, {
        name: 'Property',
        text: 'property'
      }, {
        name: 'Source',
        text: 'source',
        link: function (obj) {
          var link = formatter.getExternalLinks(obj.source + '_HOME');

          if (link) {
            return '<a href="' + link + '" target="_blank">' + obj.source + '</a>';
          }
          return obj.source;

        }
      }, {
        name: 'Source ID',
        text: 'source_id',
        link: function (obj) {
          var link = formatter.getExternalLinks(obj.source);

          if (link) {
            return '<a href="' + link + obj.source_id + '" target="_blank">' + obj.source_id + '</a>';
          }
          return obj.source_id;

        }
      }, {
        name: 'Organism',
        text: 'organism'
      }, {
        name: 'Function',
        text: 'function'
      }, {
        name: 'Classification',
        text: 'classification'
      }, {
        name: 'Antibiotics Class',
        text: 'antibiotics_class'
      }, {
        name: 'Antibiotics',
        text: 'antibiotics'
      }, {
        name: 'Assertion',
        text: 'assertion'
      }, {
        name: 'Evidence',
        text: 'evidence'
      }, {
        name: 'PubMed',
        text: 'pmid',
        link: 'http://www.ncbi.nlm.nih.gov/pubmed/'
      }, {
        name: 'BLASP Query Coverage',
        text: 'query_coverage'
      }, {
        name: 'BLASP Subject Coverage',
        text: 'subject_coverage'
      }, {
        name: 'BLASP Identity',
        text: 'identity'
      }, {
        name: 'BLASP E-Value',
        text: 'e_value'
      }, {
        name: 'Same Species',
        text: 'same_species'
      }, {
        name: 'Same Genus',
        text: 'same_genus'
      }, {
        name: 'Same Genome',
        text: 'same_genome'
      }, {
        name: 'Taxon ID',
        text: 'taxon_id',
        link: 'http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id='
      }];

      var label = (item.patric_id) ? item.patric_id : (item.refseq_locus_tag) ? item.refseq_locus_tag : item.alt_locus_tag;

      var div = domConstruct.create('div');
      displayHeader(div, label, 'fa icon-genome-features fa-2x', '/view/SpecialtyGene/' + item.feature_id, options);
      displayDetail(item, columns, div, options);

      return div;
    },

    spgene_ref_data: function (item, options) {
      options = options || {};

      var columns = [{
        name: 'Property',
        text: 'property',
        mini: true
      }, {
        name: 'Source',
        text: 'source',
        link: function (obj) {
          var link = formatter.getExternalLinks(obj.source + '_HOME');

          if (link) {
            return '<a href="' + link + '" target="_blank">' + obj.source + '</a>';
          }
          return obj.source;

        },
        mini: true
      }, {
        name: 'Source ID',
        text: 'source_id',
        link: function (obj) {
          var link = formatter.getExternalLinks(obj.source);

          if (link) {
            return '<a href="' + link + obj.source_id + '" target="_blank">' + obj.source_id + '</a>';
          }
          return obj.source_id;

        },
        mini: true
      }, {
        name: 'Gene',
        text: 'gene_name',
        mini: true
      }, {
        name: 'Organism',
        text: 'organism',
        mini: true
      }, {
        name: 'Genus',
        text: 'genus'
      }, {
        name: 'Species',
        text: 'species'
      }, {
        name: 'Locus Tag',
        text: 'locus_tag'
      }, {
        name: 'Gene ID',
        text: 'gene_id',
        link: 'http://www.ncbi.nlm.nih.gov/gene/?term=',
        mini: true
      }, {
        name: 'GI',
        text: 'gi',
        mini: true
      }, {
        name: 'Product',
        text: 'product',
        mini: true
      }, {
        name: 'Classification',
        text: 'classification'
      }, {
        name: 'PubMed',
        text: 'pmid',
        link: 'http://www.ncbi.nlm.nih.gov/pubmed/',
        mini: true
      }, {
        name: 'Function',
        text: 'function'
      }, {
        name: 'Assertion',
        text: 'assertion'
      }];

      var div = domConstruct.create('div');
      displayDetail(item, columns, div, options);

      return div;
    },

    // this is for blast result page against "Specialty gene reference proteins(faa)"
    specialty_genes: function (item, options) {
      options = options || {};

      var columns = [{
        name: 'Database',
        text: 'database',
        link: function (obj) {
          var link = formatter.getExternalLinks(obj.database + '_HOME');

          if (link) {
            return '<a href="' + link + '" target="_blank">' + obj.database + '</a>';
          }
          return obj.database;

        }
      }, {
        name: 'Source ID',
        text: 'source_id',
        link: function (obj) {
          var link = formatter.getExternalLinks(obj.database);

          if (link) {
            return '<a href="' + link + obj.source_id + '" target="_blank">' + obj.source_id + '</a>';
          }
          return obj.source_id;

        }
      }, {
        name: 'Description',
        text: 'function'
      }, {
        name: 'Organism',
        text: 'organism'
      }];

      var label = item.database + ' | ' + item.source_id;

      var div = domConstruct.create('div');
      displayHeader(div, label, 'fa icon-genome-features fa-2x', null, options);
      displayDetail(item, columns, div, options);

      return div;
    },

    taxonomy_data: function (item, options) {
      options = options || {};

      var columns = [{
        name: 'Taxonomy ID',
        text: 'taxon_id',
        link: 'http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id='
      }, {
        name: 'Rank',
        text: 'taxon_rank'
      }, {
        name: 'Lineage',
        text: 'lineage_names',
        link: function (obj) {
          var ids = obj.lineage_ids;
          return obj.lineage_names.map(function (d, idx) {
            return lang.replace('<a href="/view/Taxonomy/{0}">{1}</a>', [ids[idx], d]);
          }).join(', ');
        }
      }, {
        name: 'Genetic Code',
        text: 'genetic_code'
      }];

      var div = domConstruct.create('div');
      displayHeader(div, item.taxon_name, 'fa icon-taxonomy fa-2x', '/view/Taxonomy/' + item.taxon_id, options);

      displayDetail(item, columns, div, options);

      return div;
    },

    pathway_data: function (item, options) {
      options = options || {};

      var columns = [{
        name: 'Pathway ID',
        text: 'pathway_id'
      }, {
        name: 'Pathway Name',
        text: 'pathway_name'
      }, {
        name: 'Pathway Class',
        text: 'pathway_class'
      }, {
        name: 'Annotation',
        text: 'annotation'
      }, {
        name: 'Unique Genome Count',
        text: 'genome_count'
      }, {
        name: 'Unique Gene Count',
        text: 'gene_count'
      }, {
        name: 'Unique EC Count',
        text: 'ec_count'
      }, {
        name: 'EC Conservation',
        text: 'ec_cons'
      }, {
        name: 'Gene Conservation',
        text: 'gene_cons'
      }];

      var div = domConstruct.create('div');
      displayHeader(div, item.pathway_name, 'fa icon-git-pull-request fa-2x', '/view/Pathways/' + item.pathway_id, options);
      displayDetail(item, columns, div, options);

      return div;
    },

    subsystem_data: function (item, options) {
      options = options || {};

      var columns;

      // property set in SubSystemMemoryStore.js
      if (item.document_type === 'subsystems_gene') {
        columns = [
          {
            name: 'Superclass',
            text: 'superclass'
          }, {
            name: 'Class',
            text: 'class'
          }, {
            name: 'Subclass',
            text: 'subclass'
          }, {
            name: 'Subsystem Name',
            text: 'subsystem_name'
          }, {
            name: 'Role Name',
            text: 'role_name'
          }, {
            name: 'Active',
            text: 'active'
          }, {
            name: 'PATRIC ID',
            text: 'patric_id'
          }, {
            name: 'Gene',
            text: 'gene'
          }, {
            name: 'Product',
            text: 'product'
          }
        ];
      } else if (item.document_type === 'subsystems_subsystem') {
        columns = [
          {
            name: 'Superclass',
            text: 'superclass'
          }, {
            name: 'Class',
            text: 'class'
          }, {
            name: 'Subclass',
            text: 'subclass'
          }, {
            name: 'Subsystem Name',
            text: 'subsystem_name'
          }, {
            name: 'Active',
            text: 'active'
          }, {
            name: 'Role Names',
            text: 'role_name'
          }
        ];
      }

      var div = domConstruct.create('div');
      displayHeader(div, item.subsystem_name, 'fa icon-git-pull-request fa-2x', '/view/Subsystems/' + item.subsystem_id, options);
      displayDetailSubsystems(item, columns, div, options);

      return div;
    },

    proteinfamily_data: function (item, options) {
      options = options || {};

      var columns = [{
        name: 'ID',
        text: 'family_id'
      }, {
        name: 'Proteins',
        text: 'feature_count'
      }, {
        name: 'Genomes',
        text: 'genome_count'
      }, {
        name: 'Description',
        text: 'description'
      }, {
        name: 'Min AA Length',
        text: 'aa_length_min'
      }, {
        name: 'Max AA Length',
        text: 'aa_length_max'
      }, {
        name: 'Mean',
        text: 'aa_length_mean'
      }, {
        name: 'Std',
        text: 'aa_length_std'
      }];

      var div = domConstruct.create('div');
      displayHeader(div, item.family_id, 'fa icon-tasks fa-2x', '/view/ProteinFamilies/' + item.family_id, options);
      displayDetail(item, columns, div, options);

      return div;
    },

    msa_details: function (item, options) {
      options = options || {};
      var columns = [{
        name: 'No. of Members',
        text: 'numFeatures'
      }, {
        name: 'No. of Organisms',
        text: 'numOrganisms'
      }, {
        name: 'Min AA Length',
        text: 'minLength'
      }, {
        name: 'Max AA Length',
        text: 'maxLength'
      }];
      var div = domConstruct.create('div');
      displayHeader(div, 'MSA', 'fa icon-alignment fa-2x', '/view/MSA/', options);
      displayDetail(item, columns, div, options);

      return div;
    },

    sequence_data: function (item, options) {
      options = options || {};

      var columns = [{
        name: 'Genome Name',
        text: 'genome_name',
        mini: true
      }, {
        name: 'Genome ID',
        text: 'genome_id',
        link: '/view/Genome/'
      }, {
        name: 'Accession',
        text: 'accession',
        link: 'http://www.ncbi.nlm.nih.gov/nuccore/',
        mini: true
      }, {
        name: 'Sequence ID',
        text: 'sequence_id',
        link: function (obj) {
          return lang.replace('<a href="/view/FeatureList/?and(eq(annotation,PATRIC),eq(sequence_id,{obj.sequence_id}),eq(feature_type,CDS))" target="_blank">{obj.sequence_id}</a>', { obj: obj });
        },
        mini: true
      }, {
        name: 'Length',
        text: 'length',
        mini: true
      }, {
        name: 'GC Content',
        text: 'gc_content',
        mini: true
      }, {
        name: 'Sequence Type',
        text: 'sequence_type'
      }, {
        name: 'Topology',
        text: 'topology'
      }, {
        name: 'Description',
        text: 'description'
      }, {
        name: 'Chromosome',
        text: 'chromosome'
      }, {
        name: 'Plasmid',
        text: 'plasmid'
      }, {
        name: 'GI',
        text: 'gi'
      }, {
        name: 'Taxon ID',
        text: 'taxon_id',
        link: 'http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id='
      }, {
        name: 'Version',
        text: 'version'
      }, {
        name: 'Release Date',
        text: 'release_date'
      }];

      var div = domConstruct.create('div');
      displayHeader(div, item.sequence_id, 'fa icon-contigs fa-2x', '/view/Genome/' + item.genome_id, options);
      displayDetail(item, columns, div, options);

      return div;
    },

    transcriptomics_experiment_data: function (item, options) {
      options = options || {};

      var sectionList = ['Experiment Info', 'Additional Metadata'];
      var section = {};

      section['Experiment Info'] = [{
        name: 'Experiment ID',
        text: 'eid'
      }, {
        name: 'Accession',
        text: 'accession',
        link: 'http://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc='
      }, {
        name: 'Institution',
        text: 'institution'
      }, {
        name: 'PI',
        text: 'pi'
      }, {
        name: 'Author',
        text: 'author'
      }, {
        name: 'PubMed',
        text: 'pmid',
        link: 'http://www.ncbi.nlm.nih.gov/pubmed/'
      }, {
        name: 'Release Date',
        text: 'release_date'
      }, {
        name: 'Title',
        text: 'title'
      }, {
        name: 'Description',
        text: 'description'
      }, {
        name: 'Organism',
        text: 'organism'
      }, {
        name: 'Strain',
        text: 'strain'
      }, {
        name: 'Gene Modification',
        text: 'mutant'
      }, {
        name: 'Time Series',
        text: 'timeseries'
      }, {
        name: 'Experimental Condition',
        text: 'condition'
      }, {
        name: 'Comparisons',
        text: 'samples'
      }, {
        name: 'Platforms',
        text: 'platforms'
      }, {
        name: 'Genes',
        text: 'genes'
      }, {
        name: 'Genome IDs',
        text: 'genome_ids'
      }
      ];

      section['Additional Metadata'] = [{
        name: 'Additional Metadata',
        multiValued: true,
        text: 'additional_metadata'
      }];

      var div = domConstruct.create('div');
      displayHeader(div, item.title, 'fa icon-experiments fa-2x', '/view/TranscriptomicsExperiment/' + item.eid, options);
      displayDetailBySections(item, sectionList, section, div, options);

      return div;
    },

    transcriptomics_sample_data: function (item, options) {
      options = options || {};

      var columns = [{
        name: 'Sample ID',
        text: 'pid'
      }, {
        name: 'Experiment ID',
        text: 'eid'
      }, {
        name: 'Title',
        text: 'expname'
      }, {
        name: 'Samples',
        text: 'samples'
      }, {
        name: 'Genes',
        text: 'genes'
      }, {
        name: 'Significant Genes (Log Ratio)',
        text: 'sig_log_ratio'
      }, {
        name: 'Significant Genes (Z Score)',
        text: 'sig_z_score'
      }, {
        name: 'PubMed',
        text: 'pmid',
        link: 'http://www.ncbi.nlm.nih.gov/pubmed/'
      }, {
        name: 'Link Out',
        text: 'accession',
        link: 'http://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc='
      }, {
        name: 'Organism',
        text: 'organism'
      }, {
        name: 'Strain',
        text: 'strain'
      }, {
        name: 'Gene Modification',
        text: 'mutant'
      }, {
        name: 'Experimental Condition',
        text: 'condition'
      }, {
        name: 'Time Point',
        text: 'timepoint'
      }, {
        name: 'Channels',
        text: 'channels'
      }, {
        name: 'Platform',
        text: 'platform'
      }, {
        name: 'Genome IDs',
        text: 'genome_ids'
      }, {
        name: 'Release Date',
        text: 'release_date'
      }];

      var div = domConstruct.create('div');
      displayHeader(div, item.expname, 'fa icon-experiments fa-2x', '/view/TranscriptomicsComparison/' + item.pid, options);
      displayDetail(item, columns, div, options);

      return div;
    },

    transcriptomics_gene_data: function (item, options) {
      options = options || {};

      var columns = [{
        name: 'Genome Name',
        text: 'genome_name'
      }, {
        name: 'Accession',
        text: 'accession'
      }, {
        name: 'PATRIC ID',
        text: 'patric_id'
      }, {
        name: 'RefSeq Locus Tag',
        text: 'refseq_locus_tag'
      }, {
        name: 'Alt Locus Tag',
        text: 'alt_locus_tag'
      }, {
        name: 'Gene Symbol',
        text: 'gene'
      }, {
        name: 'Product',
        text: 'product'
      }, {
        name: 'Start',
        text: 'start'
      }, {
        name: 'End',
        text: 'end'
      }, {
        name: 'Strand',
        text: 'strand'
      }, {
        name: 'Comparisons',
        text: 'sample_size'
      }, {
        name: 'Up',
        text: 'up'
      }, {
        name: 'Down',
        text: 'down'
      }];

      var label = (item.patric_id) ? item.patric_id : (item.refseq_locus_tag) ? item.refseq_locus_tag : item.alt_locus_tag;
      var div = domConstruct.create('div');
      displayHeader(div, label, 'fa icon-genome-features fa-2x', '/view/Feature/' + item.feature_id, options);
      displayDetail(item, columns, div, options);

      return div;
    },

    interaction_data: function (item, options) {
      var sectionList = ['Interaction', 'Interactor A', 'Interactor B'];
      var section = {};

      section.Interaction = [{
        name: 'Category',
        text: 'category'
      }, {
        name: 'Interaction Type',
        text: 'interaction_type'
      }, {
        name: 'Detection Method',
        text: 'detection_method'
      }, {
        name: 'Evidence',
        text: 'evidence'
      }, {
        name: 'Source DB',
        text: 'source_db'
      }, {
        name: 'Pubmed',
        text: 'pmid',
        link: function (obj) {
          if (obj.pmid.length > 0) {
            var pmid = obj.pmid[0];
            return '<a href="http://www.ncbi.nlm.nih.gov/pubmed/' + pmid.split(';').join(',') + '" target="_blank">' + pmid + '</a>';
          }
          return '';

        }
      }, {
        name: 'Score',
        text: 'score'
      }];

      section['Interactor A'] = [{
        name: 'Interactor',
        text: 'interactor_a',
        link: function (obj) {
          return '<a href="/view/Feature/' + obj.feature_id_a + '">' + obj.interactor_a + '</a>';
        }
      }, {
        name: 'Description',
        text: 'interactor_desc_a'
      }, {
        name: 'Type',
        text: 'interactor_type_a'
      }, {
        name: 'Genome Name',
        text: 'genome_name_a'
      }, {
        name: 'Refseq Locus Tag',
        text: 'refseq_locus_tag_a',
        link: 'http://www.ncbi.nlm.nih.gov/protein/?term='
      }, {
        name: 'gene',
        text: 'gene_a'
      }];

      section['Interactor B'] = [{
        name: 'Interactor',
        text: 'interactor_b',
        link: function (obj) {
          return '<a href="/view/Feature/' + obj.feature_id_b + '">' + obj.interactor_b + '</a>';
        }
      }, {
        name: 'Description',
        text: 'interactor_desc_b'
      }, {
        name: 'Type',
        text: 'interactor_type_b'
      }, {
        name: 'Genome Name',
        text: 'genome_name_b'
      }, {
        name: 'Refseq Locus Tag',
        text: 'refseq_locus_tag_b',
        link: 'http://www.ncbi.nlm.nih.gov/protein/?term='
      }, {
        name: 'gene',
        text: 'gene_b'
      }];

      var div = domConstruct.create('div');

      displayDetailBySections(item, sectionList, section, div, options);

      return div;
    },

    genome_amr_data: function (item, options) {
      var sectionList = ['Summary', 'Measurement', 'Laboratory Method', 'Computational Method'];
      var section = {};

      section.Summary = [{
        name: 'Taxon ID',
        text: 'taxon_id'
      }, {
        name: 'Genome ID',
        text: 'genome_id'
      }, {
        name: 'Genome Name',
        text: 'genome_name'
      }, {
        name: 'Antibiotic',
        text: 'antibiotic'
      }, {
        name: 'Resistant Phenotype',
        text: 'resistant_phenotype'
      }, {
        name: 'Evidence',
        text: 'evidence'
      }, {
        name: 'PubMed',
        text: 'pmid',
        link: 'http://www.ncbi.nlm.nih.gov/pubmed/'
      }];

      section.Measurement = [{
        name: 'Sign',
        text: 'measurement_sign'
      }, {
        name: 'Value',
        text: 'measurement_value'
      }, {
        name: 'Units',
        text: 'measurement_unit'
      }];

      section['Laboratory Method'] = [{
        name: 'Method',
        text: 'laboratory_typing_method'
      }, {
        name: 'Platform',
        text: 'laboratory_typing_platform'
      }, {
        name: 'Vendor',
        text: 'vendor'
      }, {
        name: 'Version',
        text: 'laboratory_typing_method_version'
      }, {
        name: 'Testing Standard',
        text: 'testing_standard'
      }, {
        name: 'Testing Standard Year',
        text: 'testing_standard_year'
      }];

      section['Computational Method'] = [{
        name: 'Method',
        text: 'computational_method'
      }, {
        name: 'Version',
        text: 'computational_method_version'
      }, {
        name: 'Performance',
        text: 'computational_method_performance'
      }];

      var div = domConstruct.create('div');

      displayDetailBySections(item, sectionList, section, div, options);

      return div;
    },

    antibiotic_data: function (item, options) {
      options = options || {};

      var columns = [{
        name: 'Antibiotic Name',
        text: 'antibiotic_name'
      }, {
        name: 'PubChem CID',
        text: 'pubchem_cid',
        link: 'https://pubchem.ncbi.nlm.nih.gov/compound/'
      }, {
        name: 'CAS ID',
        text: 'cas_id'
      }, {
        name: 'Molecular Formula',
        text: 'molecular_formula',
        link: 'https://pubchem.ncbi.nlm.nih.gov/search/#collection=compounds&query_type=mf&sort=mw&sort_dir=asc&query='
      }, {
        name: 'Molecular Weight',
        text: 'molecular_weight'
      }, {
        name: 'InChI Key',
        text: 'inchi_key'
      }, {
        name: 'ATC Classification',
        text: 'atc_classification',
        link: function (obj) {
          return obj.atc_classification.map(function (cls) {
            return '<div class="keyword small">' + cls + '</div>';
          }).join(' ');
        }
      }];

      var div = domConstruct.create('div');
      displayDetail(item, columns, div, options);

      return div;
    },

    variant_lineage_data: function (item, options) {
      options = options || {};

      var columns = [{
        name: 'Lineage of Concern',
        text: 'lineage_of_concern'
      }, {
        name: 'Covariant',
        text: 'lineage'
      }, {
        name: 'Sequence Features',
        text: 'sequence_features'
      }, {
        name: 'Country',
        text: 'country'
      }, {
        name: 'Region',
        text: 'region'
      }, {
        name: 'Month',
        text: 'month'
      }, {
        name: 'Total Sequences',
        text: 'total_isolates'
      }, {
        name: 'Covariant Sequences',
        text: 'lineage_count'
      }, {
        name: 'Frequency',
        text: 'prevalence'
      }, {
        name: 'Growth Rate',
        text: 'growth_rate'
      }, {
        name: 'Date Modified',
        text: 'date_modified',
        type: 'date'
      }];

      var div = domConstruct.create('div');
      displayDetail(item, columns, div, options);

      return div;
    },

    variant_data: function (item, options) {
      options = options || {};

      var columns = [{
        name: 'Variant',
        text: 'aa_variant'
      }, {
        name: 'Sequence Features',
        text: 'sequence_features'
      }, {
        name: 'Country',
        text: 'country'
      }, {
        name: 'Region',
        text: 'region'
      }, {
        name: 'Month',
        text: 'month'
      }, {
        name: 'Total Sequences',
        text: 'total_isolates'
      }, {
        name: 'Variant Sequences',
        text: 'lineage_count'
      }, {
        name: 'Frequency',
        text: 'prevalence'
      }, {
        name: 'Growth Rate',
        text: 'growth_rate'
      }, {
        name: 'Date Modified',
        text: 'date_modified',
        type: 'date'
      }];

      var div = domConstruct.create('div');
      displayDetail(item, columns, div, options);

      return div;
    },

    genome_data: function (item, options) {
      options = options || {};

      var metadataGenomeSummaryID = this.genome_meta_table_names();
      var metadataGenomeSummaryValue = this.genome_meta_spec();

      var div = domConstruct.create('div');
      displayHeader(div, item.genome_name, 'fa icon-genome fa-2x', '/view/Genome/' + item.genome_id, options);

      var chromosomes = item.chromosomes || 0;
      var plasmids = item.plasmids || 0;
      var contigs = item.contigs || 0;
      var summary = 'Length: ' + item.genome_length + 'bp, ' +
        (chromosomes ? 'Chromosomes: ' + chromosomes + ', ' : '') +
        (plasmids ? 'Plasmids: ' + plasmids + ', ' : '') +
        (contigs ? 'Contigs: ' + contigs : '');

      domConstruct.create('div', {
        innerHTML: summary,
        'class': 'DataItemSummary',
        nowrap: 'nowrap'
      }, div);

      displayDetailBySections(item, metadataGenomeSummaryID, metadataGenomeSummaryValue, div, options);

      return div;
    },
    genome_meta_table_names: function () {
      return ['Organism Info', 'Genome Quality', 'Sharing', 'Isolate Info', 'Host Info', 'Sequence Info', 'Phenotype Info', 'Project Info', 'Other'];
    },

    genome_meta_spec: function () {
      var spec = {
        'Organism Info': [{
          name: 'Genome ID',
          text: 'genome_id',
          mini: true
        }, {
          name: 'Genome Name',
          text: 'genome_name',
          mini: true
        }, {
          name: 'NCBI Taxon ID',
          text: 'taxon_id',
          link: 'http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id='
        }, {
          name: 'Genome Status',
          text: 'genome_status',
          mini: true,
          editable: true
        }, {
          name: 'Strain',
          text: 'strain',
          editable: true
        }, {
          name: 'Serovar',
          text: 'serovar',
          editable: true
        }, {
          name: 'Biovar',
          text: 'biovar',
          editable: true
        }, {
          name: 'Pathovar',
          text: 'pathovar',
          editable: true
        }, {
          name: 'MLST',
          text: 'mlst',
          editable: true
        }, {
          name: 'Other Typing',
          text: 'other_typing',
          editable: true,
          isList: true
        }, {
          name: 'Culture Collection',
          text: 'culture_collection',
          editable: true,
          link: function (obj) {
            var ids = obj.culture_collection.split(',');

            // culture collection may be a csv list
            var parts = ids.map(function (id) {
              var name = id.trim();

              // match "ATCC xxxxx" or "ATCC:xxxxx"
              var regex = /ATCC[\s:]([\w-]*)/g;
              var matches = regex.exec(id);
              if (!matches || !matches.length) return id;

              // get actual id number
              var id = matches[1];

              return lang.replace(
                '<a href="https://www.atcc.org/Products/All/{id}.aspx" target="_blank">{name}</a>', {
                  id: id,
                  name: name
                });
            });

            return parts.join(', ');
          }
        }, {
          name: 'Type Strain',
          text: 'type_strain',
          editable: true
        }, {
          name: 'Antimicrobial Resistance',
          text: 'antimicrobial_resistance',
          link: function (obj) {
            return lang.replace('<a href="/view/Genome/{obj.genome_id}#view_tab=amr">AMR Phenotypes</a>', { obj: obj });
          },
          editable: true,
          isList: false // not displayed as list although returned as list
        }, {
          name: 'Reference Genome',
          text: 'reference_genome'
        }],

        'Genome Quality': [{
          name: 'Genome Quality',
          text: 'genome_quality',
          editable: false
        }, {
          name: 'Genome Quality Flags',
          text: 'genome_quality_flags',
          editable: false
        }, {
          name: 'Coarse Consistency',
          text: 'coarse_consistency',
          editable: false
        }, {
          name: 'Fine Consistency',
          text: 'fine_consistency',
          editable: false
        }, {
          name: 'CheckM Completeness',
          text: 'checkm_completeness',
          editable: false
        }, {
          name: 'CheckM Contamination',
          text: 'checkm_contamination',
          editable: false
        }],

        Sharing: [{
          name: 'Can view',
          text: 'user_read',
          editable: false,
          isList: true
        }, {
          name: 'Can edit',
          text: 'user_write',
          editable: false,
          isList: true
        }
        ],

        'Project Info': [{
          name: 'Sequencing Center',
          text: 'sequencing_centers'
        }, {
          name: 'Completion Date',
          text: 'completion_date',
          editable: true,
          type: 'date'
        }, {
          name: 'Publication',
          text: 'publication',
          link: 'http://www.ncbi.nlm.nih.gov/pubmed/',
          editable: true
        }, {
          name: 'BioProject Accession',
          text: 'bioproject_accession',
          link: 'http://www.ncbi.nlm.nih.gov/bioproject/?term=',
          mini: true,
          editable: true
        }, {
          name: 'BioSample Accession',
          text: 'biosample_accession',
          link: 'http://www.ncbi.nlm.nih.gov/biosample/',
          mini: true,
          editable: true
        }, {
          name: 'Assembly Accession',
          text: 'assembly_accession',
          link: 'http://www.ncbi.nlm.nih.gov/assembly/',
          editable: true
        }, {
          name: 'SRA Accession',
          text: 'sra_accession',
          link: function (obj) {
            return lang.replace(
              '<a href="http://www.ncbi.nlm.nih.gov/sra/?term={1}" target="_blank">{0}</a>',
              [obj.sra_accession, obj.sra_accession.split(',').join('+OR+')]
            );
          },
          editable: true
        }, {
          name: 'GenBank Accessions',
          text: 'genbank_accessions',
          link: 'http://www.ncbi.nlm.nih.gov/nuccore/',
          editable: true
        }, {
          name: 'RefSeq Accessions',
          text: 'refseq_accessions',
          link: 'http://www.ncbi.nlm.nih.gov/nuccore/',
          editable: true
        }],

        'Sequence Info': [{
          name: 'Sequencing Status',
          text: 'sequencing_status',
          editable: true
        }, {
          name: 'Sequencing Platform',
          text: 'sequencing_platform',
          editable: true
        }, {
          name: 'Sequencing Depth',
          text: 'sequencing_depth',
          editable: true
        }, {
          name: 'Assembly Method',
          text: 'assembly_method',
          editable: true
        }, {
          name: 'Chromosomes',
          text: 'chromosomes'
        }, {
          name: 'Plasmids',
          text: 'plasmids'
        }, {
          name: 'Contigs',
          text: 'contigs',
          link: function (obj) {
            return lang.replace('<a href="/view/Genome/{obj.genome_id}#view_tab=sequences">{obj.contigs}</a>', { obj: obj });
          }
        }, {
          name: 'Genome Length',
          text: 'genome_length'
        }, {
          name: 'GC Content',
          text: 'gc_content'
        }, {
          name: 'PATRIC CDS',
          text: 'patric_cds',
          link: function (obj) {
            return lang.replace('<a href="/view/Genome/{obj.genome_id}#view_tab=features&filter=and(eq(feature_type,CDS),eq(annotation,PATRIC))">{obj.patric_cds}</a>', { obj: obj });
          }
        }, {
          name: 'RefSeq CDS',
          text: 'refseq_cds'
        }],

        'Isolate Info': [{
          name: 'Isolation Site',
          text: 'isolation_site',
          editable: true
        }, {
          name: 'Isolation Source',
          text: 'isolation_source',
          editable: true,
          type: 'textarea'
        }, {
          name: 'Isolation Comments',
          text: 'isolation_comments',
          editable: true
        }, {
          name: 'Collection Year',
          text: 'collection_year',
          editable: true,
          type: 'number'
        }, {
          name: 'Collection Date',
          text: 'collection_date',
          editable: true,
          type: 'date'
        }, {
          name: 'Isolation Country',
          text: 'isolation_country',
          editable: true
        }, {
          name: 'Geographic Location',
          text: 'geographic_location',
          editable: true
        }, {
          name: 'Latitude',
          text: 'latitude',
          editable: true
        }, {
          name: 'Longitude',
          text: 'longitude',
          editable: true
        }, {
          name: 'Altitude',
          text: 'altitude',
          editable: true
        }, {
          name: 'Depth',
          text: 'depth',
          editable: true
        }, {
          name: 'Other Environmental',
          text: 'other_environmental',
          editable: true,
          isList: true
        }],

        'Host Info': [{
          name: 'Host Name',
          text: 'host_name',
          editable: true
        }, {
          name: 'Host Gender',
          text: 'host_gender',
          editable: true
        }, {
          name: 'Host Age',
          text: 'host_age',
          editable: true
        }, {
          name: 'Host Health',
          text: 'host_health',
          editable: true
        }, {
          name: 'Body Sample Site',
          text: 'body_sample_site',
          editable: true
        }, {
          name: 'Body Sample Subsite',
          text: 'body_sample_subsite',
          editable: true
        }, {
          name: 'Other Clinical',
          text: 'other_clinical',
          editable: true,
          isList: true
        }],

        'Phenotype Info': [{
          name: 'Gram Stain',
          text: 'gram_stain',
          editable: true
        }, {
          name: 'Cell Shape',
          text: 'cell_shape',
          editable: true
        }, {
          name: 'Motility',
          text: 'motility',
          editable: true
        }, {
          name: 'Sporulation',
          text: 'sporulation',
          editable: true
        }, {
          name: 'Temperature Range',
          text: 'temperature_range',
          editable: true
        }, {
          name: 'Optimal Temperature',
          text: 'optimal_temperature',
          editable: true
        }, {
          name: 'Salinity',
          text: 'salinity',
          editable: true
        }, {
          name: 'Oxygen Requirement',
          text: 'oxygen_requirement',
          editable: true
        }, {
          name: 'Habitat',
          text: 'habitat',
          editable: true
        }, {
          name: 'Disease',
          text: 'disease',
          editable: true,
          isList: true
        }],

        Other: [{
          name: 'Comments',
          text: 'comments',
          editable: true,
          type: 'textarea',
          isList: true
        }, {
          name: 'Additional Metadata',
          text: 'additional_metadata',
          editable: true,
          type: 'textarea',
          isList: true
        }, {
          name: 'Insert Date',
          text: 'date_inserted',
          type: 'date'
        }, {
          name: 'Last Modified',
          text: 'date_modified',
          type: 'date'
        }]
      };

      return spec;
    }

  };

  return function (item, type, options) {

    var new_type;
    switch (type) {
      case 'genome_group':
        new_type = 'genome_data';
        break;
      case 'feature_group':
        new_type = 'feature_data';
        break;
      case 'experiment':
        new_type = 'transcriptomics_sample_data';
        break;
      default:
        new_type = (formatters[type]) ? type : 'default';
    }

    return formatters[new_type](item, options);
  };
});
