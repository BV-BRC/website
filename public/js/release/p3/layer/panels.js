//>>built
require({cache:{"p3/widget/CreateFolder":function(){define("dojo/_base/declare dijit/_WidgetBase dojo/on dojo/dom-class dijit/_TemplatedMixin dijit/_WidgetsInTemplateMixin dojo/text!./templates/CreateFolder.html dijit/form/Form".split(" "),function(p,m,l,n,g,e,h,b){return p([m,b,g,e],{baseClass:"CreateWorkspace",templateString:h,path:"",validate:function(){var a=this.inherited(arguments);a?this.saveButton.set("disabled",!1):this.saveButton.set("disabled",!0);return a},onSubmit:function(a){var b=this;
if(this.validate()){var d=this.getValues();n.add(this.domNode,"Working");window.App.api.workspace("Workspace.create",[{objects:[[this.path+d.name,"Directory"]]}]).then(function(a){n.remove(b.domNode,"Working");a="/"+["workspace",a[0][5],a[0][8],a[0][1]].join("/");l.emit(b.domNode,"dialogAction",{action:"close",navigate:a,bubbles:!0})},function(a){n.remove(b.domNode,"Working");n.add(b.domNode,"Error");b.errorMessage.innerHTML=a})}a.preventDefault();a.stopPropagation()},onCancel:function(a){l.emit(this.domNode,
"dialogAction",{action:"close",bubbles:!0})}})})},"p3/widget/CreateWorkspace":function(){define("dojo/_base/declare dijit/_WidgetBase dojo/on dojo/dom-class dijit/_TemplatedMixin dijit/_WidgetsInTemplateMixin dojo/text!./templates/CreateWorkspace.html dijit/form/Form".split(" "),function(p,m,l,n,g,e,h,b){return p([m,b,g,e],{baseClass:"CreateWorkspace",templateString:h,validate:function(){var a=this.inherited(arguments);a?this.saveButton.set("disabled",!1):this.saveButton.set("disabled",!0);return a},
onSubmit:function(a){var b=this;if(this.validate()){var d=this.getValues();window.App.api.workspace("Workspace.create_workspace",[{workspace:d.name}]).then(function(a){a="/"+["workspace",a[0][2],a[0][1]].join("/");l.emit(b.domNode,"dialogAction",{action:"close",navigate:a,bubbles:!0})})}a.preventDefault();a.stopPropagation()},onCancel:function(a){this.emit("dialogAction",{action:"close",bubbles:!0})}})})},"p3/widget/Uploader":function(){define("dojo/_base/declare dijit/_WidgetBase dojo/on dojo/dom-class dijit/_TemplatedMixin dijit/_WidgetsInTemplateMixin dojo/text!./templates/Uploader.html dijit/form/Form dojo/_base/Deferred dijit/ProgressBar dojo/dom-construct p3/UploadManager".split(" "),
function(p,m,l,n,g,e,h,b,a,c,d,f){return p([m,b,g,e],{baseClass:"CreateWorkspace",templateString:h,path:"",validate:function(){var a=this.inherited(arguments);a?this.saveButton.set("disabled",!1):this.saveButton.set("disabled",!0);return a},uploadFile:function(b,c){this._uploading||(this._uploading=[]);var e=this;return a.when(window.App.api.workspace("Workspace.create",[{objects:[[c+b.name,"unspecified",{},""]],createUploadNodes:!0}]),function(a){n.add(e.domNode,"Working");a=a[0][0][11];if(!e.uploadTable){var c=
d.create("table",{style:{width:"100%"}},e.workingMessage);e.uploadTable=d.create("tbody",{},c)}c=d.create("tr",{},e.uploadTable);d.create("td",{innerHTML:b.name},c);f.upload({file:b,url:a},window.App.authorizationToken)})},onFileSelectionChange:function(a){},onSubmit:function(a){var b=this;a.preventDefault();a.stopPropagation();b.path&&(Object.keys(this.fileInput.files).forEach(function(a){a=b.fileInput.files[a];a.name&&this.uploadFile(a,b.path)},this),l.emit(this.domNode,"dialogAction",{action:"close",
bubbles:!0}))},onCancel:function(a){l.emit(this.domNode,"dialogAction",{action:"close",bubbles:!0})}})})},"dijit/ProgressBar":function(){define("require dojo/_base/declare dojo/dom-class dojo/_base/lang dojo/number ./_Widget ./_TemplatedMixin dojo/text!./templates/ProgressBar.html".split(" "),function(p,m,l,n,g,e,h,b){return m("dijit.ProgressBar",[e,h],{progress:"0",value:"",maximum:100,places:0,indeterminate:!1,label:"",name:"",templateString:b,_indeterminateHighContrastImagePath:p.toUrl("./themes/a11y/indeterminate_progress.gif"),
postMixInProperties:function(){this.inherited(arguments);this.params&&"value"in this.params||(this.value=this.indeterminate?Infinity:this.progress)},buildRendering:function(){this.inherited(arguments);this.indeterminateHighContrastImage.setAttribute("src",this._indeterminateHighContrastImagePath.toString());this.update()},_setDirAttr:function(a){var b="rtl"==a.toLowerCase();l.toggle(this.domNode,"dijitProgressBarRtl",b);l.toggle(this.domNode,"dijitProgressBarIndeterminateRtl",this.indeterminate&&
b);this.inherited(arguments)},update:function(a){n.mixin(this,a||{});a=this.internalProgress;var b=this.domNode,d=1;this.indeterminate?b.removeAttribute("aria-valuenow"):(-1!=String(this.progress).indexOf("%")?(d=Math.min(parseFloat(this.progress)/100,1),this.progress=d*this.maximum):(this.progress=Math.min(this.progress,this.maximum),d=this.maximum?this.progress/this.maximum:0),b.setAttribute("aria-valuenow",this.progress));b.setAttribute("aria-labelledby",this.labelNode.id);b.setAttribute("aria-valuemin",
0);b.setAttribute("aria-valuemax",this.maximum);this.labelNode.innerHTML=this.report(d);l.toggle(this.domNode,"dijitProgressBarIndeterminate",this.indeterminate);l.toggle(this.domNode,"dijitProgressBarIndeterminateRtl",this.indeterminate&&!this.isLeftToRight());a.style.width=100*d+"%";this.onChange()},_setValueAttr:function(a){this._set("value",a);Infinity==a?this.update({indeterminate:!0}):this.update({indeterminate:!1,progress:a})},_setLabelAttr:function(a){this._set("label",a);this.update()},_setIndeterminateAttr:function(a){this._set("indeterminate",
a);this.update()},report:function(a){return this.label?this.label:this.indeterminate?"\x26#160;":g.format(a,{type:"percent",places:this.places,locale:this.lang})},onChange:function(){}})})},"dojo/number":function(){define(["./_base/lang","./i18n","./i18n!./cldr/nls/number","./string","./regexp"],function(p,m,l,n,g){var e={};p.setObject("dojo.number",e);e.format=function(b,a){a=p.mixin({},a||{});var c=m.normalizeLocale(a.locale),c=m.getLocalization("dojo.cldr","number",c);a.customs=c;c=a.pattern||
c[(a.type||"decimal")+"Format"];return isNaN(b)||Infinity==Math.abs(b)?null:e._applyPattern(b,c,a)};e._numberPatternRE=/[#0,]*[#0](?:\.0*#*)?/;e._applyPattern=function(b,a,c){c=c||{};var d=c.customs.group,f=c.customs.decimal;a=a.split(";");var k=a[0];a=a[0>b?1:0]||"-"+k;if(-1!=a.indexOf("%"))b*=100;else if(-1!=a.indexOf("\u2030"))b*=1E3;else if(-1!=a.indexOf("\u00a4"))d=c.customs.currencyGroup||d,f=c.customs.currencyDecimal||f,a=a.replace(/\u00a4{1,3}/,function(a){return c[["symbol","currency","displayName"][a.length-
1]]||c.currency||""});else if(-1!=a.indexOf("E"))throw Error("exponential notation not supported");var g=e._numberPatternRE,k=k.match(g);if(!k)throw Error("unable to find a number expression in pattern: "+a);!1===c.fractional&&(c.places=0);return a.replace(g,e._formatAbsolute(b,k[0],{decimal:f,group:d,places:c.places,round:c.round}))};e.round=function(b,a,c){c=10/(c||10);return(c*+b).toFixed(a)/c};if(0==(0.9).toFixed()){var h=e.round;e.round=function(b,a,c){var d=Math.pow(10,-a||0),f=Math.abs(b);
if(!b||f>=d)d=0;else if(f/=d,0.5>f||0.95<=f)d=0;return h(b,a,c)+(0<b?d:-d)}}e._formatAbsolute=function(b,a,c){c=c||{};!0===c.places&&(c.places=0);Infinity===c.places&&(c.places=6);a=a.split(".");var d="string"==typeof c.places&&c.places.indexOf(","),f=c.places;d?f=c.places.substring(d+1):0<=f||(f=(a[1]||[]).length);0>c.round||(b=e.round(b,f,c.round));b=String(Math.abs(b)).split(".");var k=b[1]||"";a[1]||c.places?(d&&(c.places=c.places.substring(0,d)),d=void 0!==c.places?c.places:a[1]&&a[1].lastIndexOf("0")+
1,d>k.length&&(b[1]=n.pad(k,d,"0",!0)),f<k.length&&(b[1]=k.substr(0,f))):b[1]&&b.pop();f=a[0].replace(",","");d=f.indexOf("0");-1!=d&&(d=f.length-d,d>b[0].length&&(b[0]=n.pad(b[0],d)),-1==f.indexOf("#")&&(b[0]=b[0].substr(b[0].length-d)));var f=a[0].lastIndexOf(","),g,h;-1!=f&&(g=a[0].length-f-1,a=a[0].substr(0,f),f=a.lastIndexOf(","),-1!=f&&(h=a.length-f-1));a=[];for(f=b[0];f;)d=f.length-g,a.push(0<d?f.substr(d):f),f=0<d?f.slice(0,d):"",h&&(g=h,delete h);b[0]=a.reverse().join(c.group||",");return b.join(c.decimal||
".")};e.regexp=function(b){return e._parseInfo(b).regexp};e._parseInfo=function(b){b=b||{};var a=m.normalizeLocale(b.locale),a=m.getLocalization("dojo.cldr","number",a),c=b.pattern||a[(b.type||"decimal")+"Format"],d=a.group,f=a.decimal,k=1;if(-1!=c.indexOf("%"))k/=100;else if(-1!=c.indexOf("\u2030"))k/=1E3;else{var h=-1!=c.indexOf("\u00a4");h&&(d=a.currencyGroup||d,f=a.currencyDecimal||f)}a=c.split(";");1==a.length&&a.push("-"+a[0]);a=g.buildGroupRE(a,function(a){a="(?:"+g.escapeString(a,".")+")";
return a.replace(e._numberPatternRE,function(a){var c={signed:!1,separator:b.strict?d:[d,""],fractional:b.fractional,decimal:f,exponent:!1};a=a.split(".");var g=b.places;1==a.length&&1!=k&&(a[1]="###");1==a.length||0===g?c.fractional=!1:(void 0===g&&(g=b.pattern?a[1].lastIndexOf("0")+1:Infinity),g&&void 0==b.fractional&&(c.fractional=!0),!b.places&&g<a[1].length&&(g+=","+a[1].length),c.places=g);a=a[0].split(",");1<a.length&&(c.groupSize=a.pop().length,1<a.length&&(c.groupSize2=a.pop().length));return"("+
e._realNumberRegexp(c)+")"})},!0);h&&(a=a.replace(/([\s\xa0]*)(\u00a4{1,3})([\s\xa0]*)/g,function(a,d,c,f){a=g.escapeString(b[["symbol","currency","displayName"][c.length-1]]||b.currency||"");d=d?"[\\s\\xa0]":"";f=f?"[\\s\\xa0]":"";return!b.strict?(d&&(d+="*"),f&&(f+="*"),"(?:"+d+a+f+")?"):d+a+f}));return{regexp:a.replace(/[\xa0 ]/g,"[\\s\\xa0]"),group:d,decimal:f,factor:k}};e.parse=function(b,a){var c=e._parseInfo(a),d=RegExp("^"+c.regexp+"$").exec(b);if(!d)return NaN;var f=d[1];if(!d[1]){if(!d[2])return NaN;
f=d[2];c.factor*=-1}f=f.replace(RegExp("["+c.group+"\\s\\xa0]","g"),"").replace(c.decimal,".");return f*c.factor};e._realNumberRegexp=function(b){b=b||{};"places"in b||(b.places=Infinity);"string"!=typeof b.decimal&&(b.decimal=".");if(!("fractional"in b)||/^0/.test(b.places))b.fractional=[!0,!1];"exponent"in b||(b.exponent=[!0,!1]);"eSigned"in b||(b.eSigned=[!0,!1]);var a=e._integerRegexp(b),c=g.buildGroupRE(b.fractional,function(a){var d="";a&&0!==b.places&&(d="\\"+b.decimal,d=Infinity==b.places?
"(?:"+d+"\\d+)?":d+("\\d{"+b.places+"}"));return d},!0),d=g.buildGroupRE(b.exponent,function(a){return a?"([eE]"+e._integerRegexp({signed:b.eSigned})+")":""}),a=a+c;c&&(a="(?:(?:"+a+")|(?:"+c+"))");return a+d};e._integerRegexp=function(b){b=b||{};"signed"in b||(b.signed=[!0,!1]);"separator"in b?"groupSize"in b||(b.groupSize=3):b.separator="";var a=g.buildGroupRE(b.signed,function(a){return a?"[-+]":""},!0),c=g.buildGroupRE(b.separator,function(a){if(!a)return"(?:\\d+)";a=g.escapeString(a);" "==a?
a="\\s":"\u00a0"==a&&(a="\\s\\xa0");var c=b.groupSize,e=b.groupSize2;return e?(a="(?:0|[1-9]\\d{0,"+(e-1)+"}(?:["+a+"]\\d{"+e+"})*["+a+"]\\d{"+c+"})",0<c-e?"(?:"+a+"|(?:0|[1-9]\\d{0,"+(c-1)+"}))":a):"(?:0|[1-9]\\d{0,"+(c-1)+"}(?:["+a+"]\\d{"+c+"})*)"},!0);return a+c};return e})},"p3/UploadManager":function(){define(["dojo/request","dojo/_base/declare","dojo/_base/lang","dojo/_base/Deferred","dojo/topic"],function(p,m,l,n,g){return m([],{constructor:function(){this.activeCount=0;this._inProgress={};
window.addEventListener("beforeunload",l.hitch(this,function(e){if(this.listenUnload)return(e||window.event).returnValue="You are currently uploading files.  Leaving this page will cancel the uploads ."}))},token:null,upload:function(e,g){g&&(this.token=g,this.headers={Authorization:"OAuth "+g});var b=this;e instanceof Array?e.forEach(function(a){b._uploadFile(a.file,a.url)}):e&&e.file&&b._uploadFile(e.file,e.url)},listenUnload:!1,unloadPageListener:function(){this.listenUnload=!1},loadPageListener:function(){this.listenUnload=
!0},_uploadFile:function(e,h){var b=new n,a=new FormData;a.append("upload",e);req=new XMLHttpRequest;req.upload.addEventListener("progress",function(a){g.publish("/upload",{type:"UploadProgress",filename:e.name,event:a,progress:parseInt(100*(a.loaded/a.total)),url:h})});req.upload.addEventListener("load",l.hitch(this,function(a){this.activeCount--;g.publish("/upload",{type:"UploadComplete",filename:e.name,url:h});1>this.activeCount&&this.unloadPageListener();b.resolve(a)}));req.upload.addEventListener("error",
function(a){this.activeCount--;b.reject(a)});req.open("PUT",h,!0);for(var c in this.headers)req.setRequestHeader(c,this.headers[c]);g.publish("/upload",{type:"UploadStart",filename:e.name,url:h});this.activeCount++;this.loadPageListener();req.send(a);return b.promise}})()})},"url:p3/widget/templates/CreateFolder.html":'\x3cform dojoAttachPoint\x3d"containerNode" class\x3d"PanelForm"\n    dojoAttachEvent\x3d"onreset:_onReset,onsubmit:_onSubmit,onchange:validate"\x3e\n\t\x3cdiv \x3e\n\t\t\x3cdiv data-dojo-type\x3d"dijit/form/ValidationTextBox" name\x3d"name" data-dojo-attach-point\x3d"workspaceName" style\x3d"width:300px" required\x3d"true" data-dojo-props\x3d"intermediateChanges:true,missingMessage:\'Name Must be provided for Folder\',trim:true,placeHolder:\'MySubFolder\'"\x3e\x3c/div\x3e\n\t\x3c/div\x3e\n\t\t\x3cdiv class\x3d"workingMessage"\x3e\n\t\t\tCreating new workspace ...\n\t\t\x3c/div\x3e\n\n\t\t\x3cdiv class\x3d"errorMessage"\x3e\n\t\t\t\x3cdiv style\x3d"font-weight:900;font-size:1.1em;"\x3eError Creating Folder:\x3c/div\x3e\n\t\t\t\x3cp data-dojo-attach-point\x3d"errorMessage"\x3eError\x3c/p\x3e\n\t\t\x3c/div\x3e\n\t\t\n\t\t\x3cdiv style\x3d"margin:4px;margin-top:8px;text-align:right;"\x3e\n\t\t\t\x3cdiv data-dojo-attach-point\x3d"cancelButton" data-dojo-attach-event\x3d"onClick:onCancel" data-dojo-type\x3d"dijit/form/Button"\x3eCancel\x3c/div\x3e\n\t\t\t\x3cdiv data-dojo-attach-point\x3d"saveButton" type\x3d"submit" data-dojo-type\x3d"dijit/form/Button"\x3eCreate Folder\x3c/div\x3e\n\t\t\x3c/div\x3e\t\n\x3c/form\x3e\n\n',
"url:p3/widget/templates/CreateWorkspace.html":'\x3cform dojoAttachPoint\x3d"containerNode"\n    dojoAttachEvent\x3d"onreset:_onReset,onsubmit:_onSubmit,onchange:validate"\x3e\n\t\x3cdiv class\x3d"PanelForm" style\x3d""\x3e\n\t\t\x3cinput data-dojo-type\x3d"dijit/form/ValidationTextBox" name\x3d"name" data-dojo-attach-point\x3d"workspaceName" style\x3d"width:300px" required\x3d"true" data-dojo-props\x3d"intermediateChanges:true,missingMessage:\'Name Must be provided for new Workspace\',trim:true,placeHolder:\'MyWorkspace\'" /\x3e\n\t\t\x3cdiv style\x3d"margin:4px;margin-top:8px;text-align:right;"\x3e\n\t\t\t\x3cdiv data-dojo-attach-point\x3d"cancelButton" data-dojo-type\x3d"dijit/form/Button"\x3eCancel\x3c/div\x3e\n\t\t\t\x3cdiv data-dojo-attach-point\x3d"saveButton" type\x3d"submit" data-dojo-type\x3d"dijit/form/Button"\x3eCreate Workspace\x3c/div\x3e\n\t\t\x3c/div\x3e\t\n\t\x3c/div\x3e\n\x3c/form\x3e\n\n',
"url:p3/widget/templates/Uploader.html":'\x3cform dojoAttachPoint\x3d"containerNode" class\x3d"PanelForm"\n    dojoAttachEvent\x3d"onreset:_onReset,onsubmit:_onSubmit,onchange:validate"\x3e\n\t\x3cdiv style\x3d\'width:400px\'\x3e\n\t\t\x3cselect data-dojo-type\x3d"dijit/form/Select" name\x3d"type" data-dojo-attach-point\x3d"uploadType" style\x3d"width:300px" required\x3d"true" data-dojo-props\x3d"intermediateChanges:true,missingMessage:\'Name Must be provided for Folder\',trim:true,placeHolder:\'MySubFolder\'"\x3e\n\t\t\t\x3coption value\x3d"auto"\x3eAuto Detect\x3c/option\x3e\n\t\t\t\x3coption value\x3d"fasta"\x3eFASTA\x3c/option\x3e\t\t\t\n\t\t\x3c/select\x3e\n\t\t\x3cinput type\x3d"file" data-dojo-attach-point\x3d"fileInput" multiple\x3d"true" data-dojo-attach-event\x3d"onchange:onFileSelectionChange" /\x3e\t\n\t\x3c/div\x3e\n\t\t\x3cdiv class\x3d"workingMessage" style\x3d"width:400px;" data-dojo-attach-point\x3d"workingMessage"\x3e\n\t\t\x3c/div\x3e\n\n\t\t\x3cdiv style\x3d"margin:4px;margin-top:8px;text-align:right;"\x3e\n\t\t\t\x3cdiv data-dojo-attach-point\x3d"cancelButton" data-dojo-attach-event\x3d"onClick:onCancel" data-dojo-type\x3d"dijit/form/Button"\x3eCancel\x3c/div\x3e\n\t\t\t\x3cdiv data-dojo-attach-point\x3d"saveButton" type\x3d"submit" data-dojo-type\x3d"dijit/form/Button"\x3eUpload Files\x3c/div\x3e\n\t\t\x3c/div\x3e\t\n\x3c/form\x3e\n\n',
"url:dijit/templates/ProgressBar.html":'\x3cdiv class\x3d"dijitProgressBar dijitProgressBarEmpty" role\x3d"progressbar"\n\t\x3e\x3cdiv  data-dojo-attach-point\x3d"internalProgress" class\x3d"dijitProgressBarFull"\n\t\t\x3e\x3cdiv class\x3d"dijitProgressBarTile" role\x3d"presentation"\x3e\x3c/div\n\t\t\x3e\x3cspan style\x3d"visibility:hidden"\x3e\x26#160;\x3c/span\n\t\x3e\x3c/div\n\t\x3e\x3cdiv data-dojo-attach-point\x3d"labelNode" class\x3d"dijitProgressBarLabel" id\x3d"${id}_label"\x3e\x3c/div\n\t\x3e\x3cspan data-dojo-attach-point\x3d"indeterminateHighContrastImage"\n\t\t   class\x3d"dijitInline dijitProgressBarIndeterminateHighContrastImage"\x3e\x3c/span\n\x3e\x3c/div\x3e\n',
"*now":function(p){p(['dojo/i18n!*preload*p3/layer/nls/panels*["ar","ca","cs","da","de","el","en-gb","en-us","es-es","fi-fi","fr-fr","he-il","hu","it-it","ja-jp","ko-kr","nl-nl","nb","pl","pt-br","pt-pt","ru","sk","sl","sv","th","tr","zh-tw","zh-cn","ROOT"]'])}}});define("p3/layer/panels",[],1);
//# sourceMappingURL=panels.js.map