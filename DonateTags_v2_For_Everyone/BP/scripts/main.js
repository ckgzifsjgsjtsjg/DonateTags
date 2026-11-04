import { world, system } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';
const BOOK='donatetags:admins_book', RK='donatetags:ranks_v2', FK='donatetags:frozen_v2', LK='donatetags:logs_v2';
const PREFIX={ADMIN:'§c[ADMIN]§r ',MODER:'§a[MODER]§r '};
function read(k,f){try{let v=world.getDynamicProperty(k);return typeof v==='string'?JSON.parse(v):f}catch{return f}}
function save(k,v){world.setDynamicProperty(k,JSON.stringify(v))}
function players(){return world.getAllPlayers()}
function tell(p,m){try{p.sendMessage('§6[DonateTags]§r '+m)}catch{}}
function log(p,msg){let a=read(LK,[]);a.unshift(new Date().toISOString()+' | '+p.name+' | '+msg);save(LK,a.slice(0,40))}
function refresh(){let ranks=read(RK,{});for(let p of players()){let t=(PREFIX[ranks[p.name]]||'')+p.name;if(p.nameTag!==t)p.nameTag=t}}
function form(p,f,cb){system.run(()=>{if(!p.isValid)return;f.show(p).then(r=>{if(!r.canceled)system.run(()=>{if(p.isValid)cb(r)})}).catch(e=>tell(p,'§cОшибка меню: '+e))})}
function menu(p){let f=new ActionFormData().title('§c§lAdmin’s Book').body('§6DonateTags v2 | Доступно всем').button('§aВыдать ранг').button('§cСнять ранг').button('§eСписок игроков').button('§bПосмотреть ранг').button('§cЗаморозить игрока').button('§aРазморозить игрока').button('§6Журнал действий').button('Закрыть');form(p,f,r=>{switch(r.selection){case 0:rankMenu(p,true);break;case 1:rankMenu(p,false);break;case 2:list(p);break;case 3:inspect(p);break;case 4:freezeMenu(p,true);break;case 5:freezeMenu(p,false);break;case 6:logs(p);break}})}
function choose(p,title,cb){let a=players(),f=new ActionFormData().title(title).body('Выбери игрока:');for(let t of a)f.button(t.name);f.button('§7Назад');form(p,f,r=>{if(r.selection===a.length){menu(p);return}let t=a[r.selection];if(!t||!t.isValid){tell(p,'§cИгрок вышел');return}cb(t)})}
function rankMenu(p,give){choose(p,give?'Выдать ранг':'Снять ранг',t=>{if(!give){let a=read(RK,{}),old=a[t.name];if(!old){tell(p,'§eУ игрока нет ранга');return}delete a[t.name];save(RK,a);log(p,'снял '+old+' с '+t.name);refresh();tell(p,'§aРанг снят');tell(t,'§eВаш ранг снят');return}form(p,new ActionFormData().title('Ранг для '+t.name).button('§cADMIN').button('§aMODER').button('§7Назад'),r=>{if(r.selection===2){menu(p);return}let rank=['ADMIN','MODER'][r.selection];if(!rank||!t.isValid)return;let a=read(RK,{});a[t.name]=rank;save(RK,a);log(p,'выдал '+rank+' игроку '+t.name);refresh();tell(p,'§a'+t.name+': '+rank);tell(t,'§aВаш ранг: '+rank)})})}
function list(p){let a=read(RK,{}),body=players().map(t=>t.name+': '+(a[t.name]||'без ранга')).join('\n')||'Нет игроков';form(p,new ActionFormData().title('Игроки онлайн').body(body).button('Назад'),()=>menu(p))}
function inspect(p){choose(p,'Посмотреть ранг',t=>form(p,new ActionFormData().title(t.name).body('Ранг: '+(read(RK,{})[t.name]||'нет ранга')).button('Назад'),()=>menu(p)))}
function freezeMenu(p,yes){choose(p,yes?'Заморозить':'Разморозить',t=>{if(yes&&t.name===p.name){tell(p,'§cНельзя заморозить себя');return}let a=read(FK,{});if(yes){if(a[t.name]){tell(p,'§eУже заморожен');return}let v=t.location;a[t.name]={x:v.x,y:v.y,z:v.z,dimension:t.dimension.id}}else{if(!a[t.name]){tell(p,'§eНе заморожен');return}delete a[t.name]}save(FK,a);log(p,(yes?'заморозил ':'разморозил ')+t.name);tell(p,'§aГотово: '+t.name);tell(t,yes?'§cВы заморожены':'§aВы разморожены')})}
function logs(p){let a=read(LK,[]);form(p,new ActionFormData().title('Журнал действий').body(a.slice(0,15).join('\n')||'Действий пока нет').button('Назад'),()=>menu(p))}
world.afterEvents.itemUse.subscribe(e=>{if(e.itemStack?.typeId===BOOK)system.run(()=>menu(e.source))});
world.beforeEvents.chatSend.subscribe(e=>{e.cancel=true;let p=e.sender,msg=e.message;system.run(()=>world.sendMessage((PREFIX[read(RK,{})[p.name]]||'')+'§f'+p.name+'§r: '+msg))});
system.runInterval(()=>{refresh();let a=read(FK,{});for(let p of players()){let pos=a[p.name];if(!pos)continue;try{let dim=world.getDimension(pos.dimension);p.teleport({x:pos.x,y:pos.y,z:pos.z},{dimension:dim});p.onScreenDisplay.setActionBar('§cВы заморожены')}catch{}}},10);
