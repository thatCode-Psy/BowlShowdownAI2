'use strict';

var Pokemon = require('../zarel/battle-engine').BattlePokemon;
var BattleSide = require('../zarel/battle-engine').BattleSide;
var PriorityQueue = require('priorityqueuejs');

class BowlAgent{
	constructor(){
		this.name="Bowl";
		this.enemyTeam=[];
    this.enemyMoves=[];
		this.currentEnemy=-1;
		this.prevEnemy=-1;
		this.prevChoice=null;
		this.prevState=null;
		this.prevTurn=[];
	}

	fetch_random_key(obj) {
        var temp_key, keys = [];
        for (temp_key in obj) {
            if (obj.hasOwnProperty(temp_key)) {
                keys.push(temp_key);
            }
        }
        return keys[Math.floor(Math.random() * keys.length)];
    }

    getOptions(state, player) {
        if (typeof (player) == 'string' && player.startsWith('p')) {
            player = parseInt(player.substring(1)) - 1;
        }
        return Tools.parseRequestData(state.sides[player].getRequestData());
    }

   	evaluateState(state, player){

   		var myp = state.sides[player].active[0].hp / state.sides[player].active[0].maxhp;
        var thp = state.sides[1 - player].active[0].hp / state.sides[1 - player].active[0].maxhp;
        

        var mygotStatus=0;
      
        if(state.sides[player].active[0].status=='brn'){
        	if(state.sides[player].active[0].stats.atk>=state.sides[player].active[0].stats.spa){
        		mygotStatus=2.5;
        	}
        	else{
        		mygotStatus=0.5;
        	}
        }
        if(state.sides[player].active[0].status=='tox'){
        	mygotStatus=2;
        }
        if(state.sides[player].active[0].status=='psn'){
        	mygotStatus=1;
        }
        if(state.sides[player].active[0].status=='slp'){
        	mygotStatus=3;
        }
        //if(state.sides[player].active[0].status=='frz'){
        //	mygotStatus=3;
        //}
        if(state.sides[player].active[0].status=='par'){
        	mygotStatus=2;
        }
        
        var thgotStatus=0;
       
        if(state.sides[1-player].active[0].status=='brn'){
        	if(state.sides[1-player].active[0].stats.atk>=state.sides[1-player].active[0].stats.spa){
        		thgotStatus=2.5;
        	}
        	else{
        		thgotStatus=0.5;
        	}
        }
        if(state.sides[1-player].active[0].status=='tox'){
        		thgotStatus=2;
        }
        if(state.sides[1-player].active[0].status=='psn'){
       		thgotStatus=1;
        }
        if(state.sides[1-player].active[0].status=='slp'){
        	thgotStatus=3;
        }
       	//if(state.sides[1-player].active[0].status=='frz'){
        //	thgotStatus=3;
        //}
        if(state.sides[1-player].active[0].status=='par'){
       		thgotStatus=2;
        }
        

        return (myp+(thgotStatus/9))-(3*thp+(mygotStatus/9))-0.3*state.turn;
   	}

   	getWorstOutcome(state, playerChoice, player) {
        var nstate = state.copy();
        var oppChoices = this.getOptions(nstate, 1 - player);
        var worststate = null;
        for (var choice in oppChoices) {
            if(choice.startsWith('switch')){
            var cstate = nstate.copy();
            //console.log(choice);

            cstate.choose('p' + (player + 1), playerChoice);
            cstate.choose('p' + (1 - player + 1), choice);
            if (worststate == null || this.evaluateState(cstate,  player) < this.evaluateState(worststate, player)) {
                worststate = cstate;
            }
          }
        }
        for(var i=0;i<nstate.sides[1-nstate.me].active[0].moves.length;i++){
          var choice=nstate.sides[1-nstate.me].active[0].moves[i];
          var cstate = nstate.copy();
          //console.log(choice);

          cstate.choose('p' + (player + 1), playerChoice);
          cstate.choose('p' + (1 - player + 1), choice);
          if (worststate == null || this.evaluateState(cstate,  player) < this.evaluateState(worststate, player)) {
              worststate = cstate;
          }
        }
        return worststate;
    }
    

    getFirst(){
    	
    	for(var i=0;i<this.prevTurn.length;i++){
       		//console.log("thing "+this.prevTurn[i][2]);
       		if(this.prevTurn[i][2]){
       			if(this.prevTurn[i][2].startsWith(this.mySide)){
       				//console.log(this.prevTurn[i]);
       				return 1;
       			}
       			else if(this.prevTurn[i][2].startsWith("p")){
       			//	console.log(this.prevTurn[i]);
       				return 2;
       			}
       		}
       	}
       	return 0;
    }

    /*changeStringFormat(move){
      move=move.toLowerCase();
      move=move.split(" ");
      var temp="";
      for(var i=0;i<move.length;i++){
        temp+=move[i];
      }
      return temp;
    }*/

    getLastOpponentMove(){
      var val ="error";
    	for(var i=0;i<this.prevTurn.length;i++){
       		//console.log("thing "+this.prevTurn[i][2]);
       	if(this.prevTurn[i][2]){
       		if(!this.prevTurn[i][2].startsWith(this.mySide)&&this.prevTurn[i][2].startsWith("p")){
       			if(this.prevTurn[i][1]=="switch"){
       				val="switch";
              //return "switch";
       			}
       			else if(this.prevTurn[i][1]=="move"){
       				val=this.prevTurn[i][3];
              //return this.prevTurn[i][3];
       			}
       			else if(this.prevTurn[i][1]=="cant"){
       				val="cant";
              //return "cant";
       			}
            else if(this.prevTurn[i][1]=="-ability"){
              var ability=this.prevTurn[i][3];
              ability=Tools.getAbility(ability);
              if(this.enemyTeam[this.currentEnemy].baseAbility!=toId(ability)){
                //console.log(this.enemyTeam[this.currentEnemy].species);
               // console.log(ability);
                this.enemyTeam[this.currentEnemy].baseAbility = toId(ability);
                this.enemyTeam[this.currentEnemy].ability = this.enemyTeam[this.currentEnemy].baseAbility;
                this.enemyTeam[this.currentEnemy].abilityData = { id: this.enemyTeam[this.currentEnemy].ability };
              }
            }
       		}
       	}
       }
       return val;
    }

    

    decide(gameState, options, mySide) {
       	var d = new Date();
        var n = d.getTime();
        // It is important to start by making a deep copy of gameState.  We want to avoid accidentally modifying the gamestate.
        var nstate = gameState.copy();
        nstate.p1.currentRequest = 'move';
        nstate.p2.currentRequest = 'move';
        nstate.me = mySide.n;
        this.mySID = mySide.n;
        this.mySide = mySide.id;

        function battleSend(type, data) {
            if (this.sides[1 - this.me].active[0].hp == 0) {
                this.isTerminal = true;
            }
            else if (this.sides[1 - this.me].currentRequest == 'switch' || this.sides[this.me].active[0].hp == 0) {
                this.badTerminal = true;
            }
        }

        nstate.send = battleSend;
      
       	
       	
       	
       	for(var i=0;i<this.enemyTeam.length;i++){
       		if(this.enemyTeam[i].species==nstate.sides[1-nstate.me].active[0].species){
       			
       			
       			this.currentEnemy=i;
       		}
       	}

       	var first=this.getFirst();
       	
       
       	
       	
       	var changeMoves=false;
       	       	
      // 	console.log("first is "+first);
       	if(this.prevState){
	       	
          if(first!=0){
	       	//	console.log("turn is "+this.prevTurn[0][2]);
	       		var lastMove=this.getLastOpponentMove();
	       	//	console.log(Tools.getMove(lastMove).priority);
	       		

	       	//	console.log("the prevChoice is "+this.prevChoice+" and opponent's was "+lastMove);

	       		if(lastMove!="switch"){
              
	       			if(Tools.getMove(lastMove).priority==Tools.getMove(toId(this.prevChoice.id)).priority){
	       			//	console.log("test of move "+Tools.getMove(toId(this.prevChoice)).name);
	       			//	console.log("prev speed of ours is "+this.prevState.sides[this.prevState.me].active[0].stats.spe);
	       			//	console.log("prev speed of enemy is "+this.enemyTeam[this.prevEnemy].stats.spe);
                



	       				var ourBoosts=this.prevState.sides[this.prevState.me].active[0].boosts;
	       				var enBoosts=this.prevState.sides[1-this.prevState.me].active[0].boosts;
				    		let boostTable = [1, 1.5, 2, 2.5, 3, 3.5, 4];
				    		var ourMult=Math.pow(boostTable[Math.abs(ourBoosts)],Math.sign(ourBoosts));
					     	var enMult=Math.pow(boostTable[Math.abs(ourBoosts)],Math.sign(enBoosts));
	       				if(first==1&&this.prevState.sides[this.prevState.me].active[0].getStat('spe',false,false)*ourMult<this.enemyTeam[this.prevEnemy].getStat('spe',false,false)*enMult){

	       					this.enemyTeam[this.prevEnemy].stats.spe=Math.floor(this.prevState.sides[this.prevState.me].active[0].stats.spe/enMult)-Math.ceil(enMult);
	       				}
	       				if(first==2&&this.prevState.sides[this.prevState.me].active[0].getStat('spe',false,false)*ourMult>this.enemyTeam[this.prevEnemy].getStat('spe',false,false)*enMult){
	       					this.enemyTeam[this.prevEnemy].stats.spe=Math.floor(this.prevState.sides[this.prevState.me].active[0].stats.spe/enMult)+Math.floor(enMult);
	       				}

	       			}

              lastMove=Tools.getMove(lastMove);
              //console.log(this.enemyTeam[this.prevEnemy].species);
              //console.log(lastMove.name+" "+!this.enemyMoves[this.prevEnemy].includes(toId(lastMove))+" "+this.enemyTeam[this.prevEnemy].moves.includes(toId(lastMove)));
              if(!this.enemyMoves[this.prevEnemy].includes(toId(lastMove))&&this.enemyTeam[this.prevEnemy].moves.includes(toId(lastMove))){
                this.enemyMoves[this.prevEnemy].push(toId(lastMove));
                  
                if(this.enemyMoves[this.prevEnemy].length==4){
                  //console.log("Established moves");
                  //console.log(this.enemyMoves[this.prevEnemy]);
                  this.enemyTeam[this.prevEnemy].moves=this.enemyMoves[this.prevEnemy];
                  changeMoves=true;
                }
              }

	       			
	       		}
	       		else if(lastMove=="error"){
	       			throw new Error("Something went badly error error!");
	       		}
	       	}
       	}
        /*if(changeMoves){

          var oppChoices = this.getOptions(nstate, 1 - nstate.me);

          console.log(this.enemyTeam[this.currentEnemy].species +" "+ nstate.sides[1-nstate.me].active[0].species);
          /*
          for (var choice in oppChoices) {
            console.log(choice);
          }
          
          console.log("Moves to be copied "+this.enemyTeam[this.currentEnemy].moves+"\n");
          console.log("original "+nstate.sides[1-nstate.me].active[0].moves);
        }
        */
       	nstate.sides[1-nstate.me].active[0]=this.enemyTeam[this.currentEnemy];
        //if(changeMoves){
         // var oppChoices = this.getOptions(nstate, 1 - nstate.me);
         // console.log("printing updated");
         // for (var choice in oppChoices) {
          //  console.log(choice);
          //  if(choice.startsWith('switch')){
          //    console.log("kek");
          //  }
          //}
         // console.log("moves "+nstate.sides[1-nstate.me].active[0].moves+" "+nstate.sides[1-nstate.me].active[0].moves.length);

        //}
        

       	var pQueue = new PriorityQueue(function (a, b) {
       		/*
            var myp = a.sides[a.me].active[0].hp / a.sides[a.me].active[0].maxhp;
            var thp = a.sides[1 - a.me].active[0].hp / a.sides[1 - a.me].active[0].maxhp;
            var aeval = myp - 3 * thp - 0.3 * a.turn;

            var mypb = b.sides[b.me].active[0].hp / b.sides[b.me].active[0].maxhp;
            var thpb = b.sides[1 - b.me].active[0].hp / b.sides[1 - b.me].active[0].maxhp;
            var beval = mypb - 3 * thpb - 0.3 * b.turn;

            return aeval - beval;
            */
          var myp = a.sides[a.me].active[0].hp / a.sides[a.me].active[0].maxhp;
	        var thp = a.sides[1 - a.me].active[0].hp / a.sides[1 - a.me].active[0].maxhp;
	        var mygotStatus=0;      
	        if(a.sides[a.me].active[0].status=='brn'){
	        	if(a.sides[a.me].active[0].stats.atk>=a.sides[a.me].active[0].stats.spa)
				    //Should be based on whether the pokemon will deal less damage while burned, not the atk v. spa
				    {
	        		mygotStatus=2.5;
	        	}
	        	else{
	        		mygotStatus=0.5;
	        	}
	        }
	        if(a.sides[a.me].active[0].status=='tox')
			//Excludes when getting toxiced is good, like all the toxic orb pokemon
			    {
	        	mygotStatus=2;
	        }
	        if(a.sides[a.me].active[0].status=='psn')
			//Excludes when getting poisoned is good, like how it's usually better for toxic orb pokemon
			    {
	        	mygotStatus=1;
	        }
	        if(a.sides[a.me].active[0].status=='slp')
			//If the pokemon has Sleep Talk, it should be more okay with this
			    {
	        	mygotStatus=3;
	        }
	        //if(a.sides[a.me].active[0].status=='frz')
			//Are we sure we should even be checking for this?
			    //{
	       // 	mygotStatus=3;
	        //}
	        if(a.sides[a.me].active[0].status=='par')
			     //The amount this is bad is proportional to the pokemon's speed relative to the speeds of opposing pokemon
			    {
	        	mygotStatus=2;
	        }
	        
	        var thgotStatus=0;
	       
	        if(a.sides[1-a.me].active[0].status=='brn'){
	        	if(a.sides[1-a.me].active[0].stats.atk>=a.sides[1-a.me].active[0].stats.spa){
	        		thgotStatus=2.5;
	        	}
	        	else{
	        		thgotStatus=0.5;
	        	}
	        }
	        if(a.sides[1-a.me].active[0].status=='tox'){
	        		thgotStatus=2;
	        }
	        if(a.sides[1-a.me].active[0].status=='psn'){
	       		thgotStatus=1;
	        }
	        if(a.sides[1-a.me].active[0].status=='slp'){
	        	thgotStatus=3;
	        }
	       	//if(a.sides[1-a.me].active[0].status=='frz'){
	        //	thgotStatus=3;
	        //}
	        if(a.sides[1-a.me].active[0].status=='par'){
	       		thgotStatus=2;
	        }
	        

	        var aeval = (myp+(thgotStatus/9))-(3*thp+(mygotStatus/9))-0.3*a.turn;

	        var mypb = b.sides[b.me].active[0].hp / b.sides[b.me].active[0].maxhp;
	        var thpb = b.sides[1 - b.me].active[0].hp / b.sides[1 - b.me].active[0].maxhp;
	        var mygotStatusb=0;      
	        if(b.sides[b.me].active[0].status=='brn'){
	        	if(b.sides[b.me].active[0].stats.atk>=b.sides[b.me].active[0].stats.spa){
	        		mygotStatusb=2.5;
	        	}
	        	else{
	        		mygotStatusb=0.5;
	        	}
	        }
	        if(b.sides[b.me].active[0].status=='tox'){
	        	mygotStatusb=2;
	        }
	        if(b.sides[b.me].active[0].status=='psn'){
	        	mygotStatusb=1;
	        }
	        if(b.sides[b.me].active[0].status=='slp'){
	        	mygotStatusb=3;
	        }
	        //if(b.sides[b.me].active[0].status=='frz'){
	        //	mygotStatusb=3;
	        //}
	        if(b.sides[b.me].active[0].status=='par'){
	        	mygotStatusb=2;
	        }
	        
	        var thgotStatusb=0;
	       
	        if(b.sides[1-b.me].active[0].status=='brn'){
	        	if(b.sides[1-b.me].active[0].stats.atk>=b.sides[1-b.me].active[0].stats.spa){
	        		thgotStatusb=2.5;
	        	}
	        	else{
	        		thgotStatusb=0.5;
	        	}
	        }
	        if(b.sides[1-b.me].active[0].status=='tox'){
	        		thgotStatusb=2;
	        }
	        if(b.sides[1-b.me].active[0].status=='psn'){
	       		thgotStatusb=1;
	        }
	        if(b.sides[1-b.me].active[0].status=='slp'){
	        	thgotStatusb=3;
	        }
	       	if(b.sides[1-b.me].active[0].status=='frz'){
	        	thgotStatusb=3;
	        }
	        if(b.sides[1-b.me].active[0].status=='par'){
	       		thgotStatusb=2;
	        }
	        

	        var beval = (mypb+(thgotStatusb/9))-(3*thpb+(mygotStatusb/9))-0.3*b.turn;
            
          return aeval-beval;
          }
        );
        
        for (var choice in options) {
            var cstate = nstate.copy();
            //console.log(choice);
            cstate.baseMove = choice;
          
            var badstate = this.getWorstOutcome(cstate, choice, nstate.me);
             // console.log(badstate.baseMove);
            if (badstate.isTerminal) {
           //     console.log("a");
            	  this.prevEnemy=this.currentEnemy;
      			    this.prevChoice=badstate.baseMove;
    			      this.prevState=nstate;
      		      this.prevTurn=[];
                return this.prevChoice;
            }
            if (!badstate.badTerminal) {
                pQueue.enq(badstate);
            }
        }

        
        while ((new Date()).getTime() - n <= 500) {
            if (pQueue.isEmpty()) {
                // console.log('FAILURE!');
              //  console.log("b");
                this.prevEnemy=this.currentEnemy;
      		    	this.prevChoice=this.fetch_random_key(options);
    		      	this.prevState=nstate;
      		    	this.prevTurn=[];
                return this.prevChoice;
            }
            var cState = pQueue.deq();

            var myTurnOptions = this.getOptions(cState, mySide.id);
            for (var choice in myTurnOptions) {
                var dstate = this.getWorstOutcome(cState, choice, cState.me);
                //dstate.baseMove=;
                if (dstate && dstate.isTerminal) {
              //       console.log("c");
                   	this.prevEnemy=this.currentEnemy;
      		      		this.prevChoice=dstate.baseMove;
    		        		this.prevState=nstate;
      		      		this.prevTurn=[];
                    return this.prevChoice;
                }
                if (dstate && !dstate.badTerminal) {
                    pQueue.enq(dstate);
                }
            }
            

        }
        // console.log('oops I timed out!');
        if (!pQueue.isEmpty()) {
           //console.log("d");
        	this.prevEnemy=this.currentEnemy;
         // var thing=pQueue.deq().baseMove;
      		this.prevChoice=pQueue.deq().baseMove;
    		  this.prevState=nstate;
      		this.prevTurn=[];
          //1console.log(pQueue.deq());
          //console.log(pQueue.isEmpty());
            return this.prevChoice;
        }
        //console.log("e");
       	var choice = this.fetch_random_key(options);
       	//console.log("the choice is "+choice);
      	this.prevEnemy=this.currentEnemy;
        this.prevChoice=choice;
    	  this.prevState=nstate;
      	this.prevTurn=[];

     	return choice;
    }

    assumePokemon(pname, plevel, pgender, side) {
        var template = Tools.getTemplate(pname);
        var nSet = {
            species: pname,
            name: pname,
            level: plevel,
            gender: pgender,
            evs: { hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85 },
            ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
            nature: "Hardy",
            moves: []
        };
        for (var moveid in template.randomBattleMoves) {
            nSet.moves.push(toId(template.randomBattleMoves[moveid]));
        }
        var basePokemon = new Pokemon(nSet, side);
      	// console.log("This is assumePokemon on "+nSet.name);
        // If the species only has one ability, then the pokemon's ability can only have the one ability.
        // Barring zoroark, skill swap, and role play nonsense.
        // This will be pretty much how we digest abilities as well
        //if (Object.keys(basePokemon.template.abilities).length == 1) {
            basePokemon.baseAbility = toId(basePokemon.template.abilities['0']);
            basePokemon.ability = basePokemon.baseAbility;
            basePokemon.abilityData = { id: basePokemon.ability };
       // }
        basePokemon.trapped=false;
        this.enemyTeam.push(basePokemon);
        this.enemyMoves.push([]);
        return basePokemon;
    }
    digest(line) {
    	line=line.split("|");
    	//console.log("line "+line);
    	this.prevTurn.push(line);
    	//console.log("thing "+this.prevTurn[0])
    }

    getTeam(format) {
    	
    }
   
}

exports.Agent=BowlAgent;