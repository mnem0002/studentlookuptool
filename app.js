/*
Author: Abhi Balreddygari

Modified On: 16/03/2021 by Milad Nemati
*/

const API_KEY = "AIzaSyCJYGWWCwZxp6iT3KVy68ASYEDu26vGpG4"
const SPREADSHEET_ID = "16SdsbZ6DSz_VZuKKAxUJjVEIua-kvj--MfgPDbvx1bM"
const EXAM_SEARCH_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Student%20Search/?key=${API_KEY}`

const CLAYTON_SITE_ID = "00"

const BUILDINGS = {
  "BLD73": {
    name : "Building 73",
    address : "49 Rainforest Walk",
    code : "0730",
    getFloor: function(roomID) { return `0${roomID[0]}` }
  },
  "MCLV": {
    name : "Monash College Learning Village",
    address  : "33 Innovation Walk",
    code : "073P",
    getFloor: function(roomID) { return `0${roomID[1]}` }
  },
  "WS": {
    name : "Woodside Building",
    address : "20 Exhibition Walk",
    code : "0940",
    getFloor: function(roomID) { return roomID[0] == "L" ? `LG`:`0${roomID[1]}` }
  },
  "LTB": {
    name : "Learning & Teaching Building",
    address : "19 Ancora Imparo Way",
    code : "0920",
    getFloor: function(roomID) { return `0${roomID[0]}` }
  },
}


function formatDate(dateString) {
  let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  var inputDate  = new Date(dateString)
  return inputDate.toLocaleDateString("en-AU", options)
}

function displayDate() {
  document.getElementById("date").innerHTML = formatDate((new Date()).toString())
}

async function getRoomAllocationData() {
  let today = new Date(); today.setHours(0,0,0,0);
  return await fetch(EXAM_SEARCH_URL)
    .then(response => response.json())
    .then(data => data.values.filter(row => new Date(row[0]) >= today))
}

function searchRoomAllocationData(data, query) {
  return data.filter(row => { return (row[2].toLowerCase()).search(query) != -1 })
}

function getLocCode(siteID,building,roomID) {
  let buildingID = building.code
  let floorID = building.getFloor(roomID)
  return `${siteID}${buildingID}${floorID}${roomID}`
}

function formatRoomAllocationData(data) {
  return data.map( row => {
    let roomID = row[5]
    let building = BUILDINGS[row[4]] || {name: "Lookup Error", address: "-", mazeMapURL: "http://use.mazemap.com/?campusid=159"}
    if (!building.mazeMapURL) {building.mazeMapURL = `http://use.mazemap.com/?campusid=159&sharepoitype=identifier&sharepoi=${getLocCode(CLAYTON_SITE_ID,building,roomID)}&zoom=21`}
    return { 
      student: `Name: ${row[2]}`,
      date : formatDate(row[0]),
      session: row[1],
      name: building.name, 
      room: `Room ${roomID}`,
      address: building.address, 
      mazeMapURL: building.mazeMapURL
      } 
  })
}

function createAllocationElement(id, allocation) {
  let allocationElement = document.createElement("div")
  allocationElement.id = id
  allocationElement.className = "studentAllocation"
  for (const [key, value] of Object.entries(allocation)) {
    let element = document.createElement("div")
    let text = document.createTextNode(value)
    if (key == "mazeMapURL") {
      let aElement = document.createElement("a")
      aElement.href = value
      text = document.createTextNode("🡢 Directions")
      aElement.appendChild(text)
      text = aElement
    } 
    element.className = `${key}`
    element.appendChild(text)
    allocationElement.appendChild(element)
  }
  return allocationElement
}

function renderRoomAllocationData(data) {
  let list = document.getElementById("list")
  list.replaceChildren()
  for (const [index, allocation] of data.entries()) {
    list.appendChild(createAllocationElement(`a${index}`,allocation))
  }
  if (list.children.length == 0) {
    list.appendChild(createAllocationElement("a0",{error: "Sorry, no matches found"}))
  }
}

function search() {
  let query = document.forms["search_form"]["search_query"].value.toLowerCase()
  allocations
    .then(data => searchRoomAllocationData(data,query))
    .then(data => formatRoomAllocationData(data))
    .then(data => renderRoomAllocationData(data))
}


displayDate();
let allocations = getRoomAllocationData()