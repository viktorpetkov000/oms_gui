loginFormData = [
  {type:"settings",position:"label-left", labelWidth:60, inputWidth:150},
  {type:"combo", name:'user', label:'User:', readonly:"true", options:[]},
  {type:"password", name:"pass", label:"Password:"},
  {type:"combo", name:"domain", label:"Domain:", readonly:"true", options:[]},
  {type:"button", name:"login", value:"Login"}
]

form1Data = [
  {type:"block", offsetTop:15, list:[
    {type:"settings", position:"label-left", inputWidth:220, labelWidth:70},
    {type:"input", name:"isin", label:"ISIN"},
    {type:"input", name:"quantity", label:"Quantity"},
    {type:"combo", name:"side", label:"Side", readonly:"true", options:[
      {text:"Buy", value: "Buy"},
      {text:"Sell", value: "Sell"},
      {text:"Sell short", value: "Sell short"}
    ]},
    {type:"combo", name:"type", label:"Type", readonly:"true", options:[
      {text:"Market", value: "Market"},
      {text:"Limit", value: "Limit"},
      {text:"Stop", value: "Stop"},
      {text:"Stop Limit", value: "Stop Limit"}
    ]},
    {type:"input", name:"limit", label:"Limit", disabled:"true"},
    {type:"input", name:"stop", label:"Stop", disabled:"true"},
    {type:"combo", name:"tif", label:"TIF", readonly:"true", options:[
      {text:"Day", value: "DAY"},
      {text:"Good Till Cancel", value: "GTC"},
      {text:"Immediate or Cancel", value: "IOC"},
      {text:"Fill or Kill", value: "FOK"},
      {text:"Good Till Date", value: "GTD"}
    ]},
    {type:"calendar", name:"date", label:"Date", hidden:"true"},
  ]},
  {type: "block",offsetTop:10,list: [
    {type:"button", value:"Prepare", name:"prepare", offsetLeft: 60, disabled:"true"},
    {type:"newcolumn"},
    {type:"button", value:"Update", name:"update", disabled:"true", offsetLeft:3},
    {type:"newcolumn"},
    {type:"button", value:"Delete", name:"delete", offsetLeft: 3, disabled:"true"},
    {type:"button", value:"Submit", name:"submit", offsetTop: 5, offsetLeft: 2, disabled:"true"},
  ]},
]


form2Data = [
  {type:"block", offsetTop:15, list:[
    {type:"settings", position:"label-left", inputWidth:220, labelWidth:70},
    {type:"input", name:"o_quantity", label:"Quantity", inputLeft:150},
    {type:"input", name:"o_limit", label:"Limit", inputTop:40, inputLeft:100},
    {type:"button", name:"cancel", value:"Cancel", position:"absolute", inputLeft:100, inputTop:80},
    {type:"button", name:"replace", value:"Replace", position:"absolute", inputLeft:180, inputTop:80}
  ]},
]

tempForm = [
  {type:"button", value:"Save", name:"test"}
]

listData = [
  {"id":"1","name":"LUX135-1","settings":""},
  {"id":"2","name":"LUX135-2","settings":""},
  {"id":"3","name":"LUX135-3","settings":""},
  {"id":"4","name":"LUX135-4","settings":""},
  {"id":"5","name":"Test","settings":"1-1,2"},
  {"id":"6","name":"1,2","settings":"1,2"},
  {"id":"7","name":"1-1","settings":"1-1"},
  {"id":"8","name":"LUX135-8","settings":""},
]

treeData =
'<tree id="0">\
  <item text="1" id="1">\
    <item text="1-1" id="1-1">\
      <item text="1-1-1" id="1-1-1"/>\
      </item>\
    <item text="1-2" id="1-2"/>\
    </item>\
  <item text="2" id="2"/>\
</tree>'
