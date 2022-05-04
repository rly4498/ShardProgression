Vars.enableConsole = true;
//for streamline's bullet because this runs first before hjson
const moltenTin = extend(Liquid, "molten-tin", {
  viscosity: 0.8,
  temperature: 1,
  effect: StatusEffects.melting,

  color: Color.valueOf("cbcdcd"),
  barColor: Color.valueOf("cbcdcd"),
  lightColor: Color.valueOf("ff0000"),
});

let scripts = [
  //Blocks-power
  "blocks/power/hydro-generator",
  "blocks/power/turbine-generator",

  //Blocks-production
  "blocks/production/automated-press",

  //Blocks-turret
  "blocks/turrets/spark",
  "blocks/turrets/streamline",

  //Blocks-defence
  "blocks/defence/absorber-wall"
];

scripts.forEach(cont => {
  try{
    require(cont);
  }catch(err){
    Log.err(err);
  }
});