
let begintime = new Date(new Date().setFullYear(new Date().getFullYear() - 1))
let events = await service.event.getFromArchive();
let lastyearevents = events.objects.filter((event) => new Date(event.beginTime) > begintime)
let datapoints = await service.datapoint.get();
let interfaces = await service.extension.get();

console.log("\n[DATAPOINTS]");
console.log("Datapoints saved: ", datapoints.objects.length);
console.log("Datapoints in unknown State: ", datapoints.objects.filter(datapoint => datapoint.effectiveState.flags == 4096).length)

console.log("\n[EXTENSIONS]");
console.log("Extensions and the main connected Servers: ", interfaces.objects.length);
interfaces.objects.forEach((interface)=> {
    console.log(interface.code, 
        interface.name, 
        interface.module, 
        interface.mainStationServer1, 
        interface.mainStationServer2, 
        interface.mainStationServer3
    )
})
console.log("\n[EVENTS]");
console.log("Events in archive: ", events.objects.length);
console.log("Events last year: ", lastyearevents.length);
console.log("Last years events grouped by Extensions: ");
interfaces.objects.forEach((interface) => {
    let interfaceevents = lastyearevents.filter((event) => event.link.ext == interface.code);
    console.log("[", interface.name, "]", 
        "Total:", interfaceevents.length,
        "Alarms:", interfaceevents.filter((event)=> event.type == 1).length,
        "Faults:", interfaceevents.filter((event)=> event.type == 2).length,
        "Messages:", interfaceevents.filter((event)=> event.type == 4).length,
        "Warnings:", interfaceevents.filter((event)=> event.type == 8).length,
    )
    
})
console.log("\n[USERS]");
let users = await service.user.get();
console.log("Users and their last login: ")
users.objects.forEach((user)=> {
    let flags = [];
    if (user.flags.toString(2).slice(-1) == 1 ) {
        flags.push("Deactivated");
    }
    if (user.flags.toString(2).slice(-3, -2) == 1) {
        flags.push("Administrator");
    }
    if (user.flags.toString(2).slice(-2, -1) == 1) {
        flags.push("Unknown Flag set");
    }
    console.log(user.code, flags, user.lastLoginTime)
})

console.log("\n[WORKSTATIONS]");
let stations = await service.station.get();
stations.objects.forEach((station) => {
    console.log(station.num, station.name)
})

let persons = await service.person.get();
console.log("\n[PERSONS]");
console.log("Saved persons: ", persons.objects.length)
persons.objects.forEach((person) => {
    console.log(person.lastName, person.firstName, person.company, person.email, person.phoneCompany, person.phoneMobile, person.phonePrivate)
})