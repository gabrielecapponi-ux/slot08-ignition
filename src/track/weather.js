export const WEATHER = {
  dry:{label:'Asciutto',grip:1},
  rain:{label:'Pioggia',grip:.78},
  heat:{label:'Asfalto rovente',grip:1.13},
  snow:{label:'Neve a tratti',grip:1,patch:{label:'NEVE COMPATTA',short:'Neve',color:'#e3eef5',grip:.65}},
  sand:{label:'Sabbia a tratti',grip:1,patch:{label:'LINGUA DI SABBIA',short:'Sabbia',color:'#d6ad73',grip:.72}}
};
export function setWeather(track,choice){
  const sequence=['dry','rain','heat','sand','snow'];
  const index=track.variant>=0?track.variant:track.index;
  const key=Object.hasOwn(WEATHER,choice)?choice:sequence[index%sequence.length];
  track.weather=key;
  const patch=WEATHER[key].patch;
  if(!patch)return;
  for(const [i,fraction] of [.29,.68].entries()){
    const length=Math.min(4.5,track.length*.07);
    for(let start=track.length*fraction;start<track.length*.94;start+=.5){
      if(track.tunnelAt?.(start+length/2,length/2)||track.conditions.some(z=>start<z.start+z.length+.3&&start+length+.3>z.start))continue;
      track.conditions.push({...patch,type:key,start,length,lane:(index+i)%track.laneCount});
      break;
    }
  }
}
