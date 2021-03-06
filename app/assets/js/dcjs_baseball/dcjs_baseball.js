//Crossfilter
var hist = function(data_in, chart_id, value, chart_title) {

  var margin = {
      "top": 30,
      "right": 30,
      "bottom": 50,
      "left": 30
    },
    width = 1000 - margin.left - margin.right,
    height = 250 - margin.top - margin.bottom;

  var x = d3.scale.linear()
    .domain([0, 1])
    .range([0, width]);

  var y = d3.scale.linear()
    .domain([0, d3.max(data_in, function(d) {
      return d.value[value];
    })])
    .range([height, 0]);
  
  d3.select("#" + chart_id).remove();
  
  var div = d3.select("#dcjs_baseball_container").append("div").attr("id", chart_id);
  
  div.append("h2").text(chart_title);
  
  var svg = div.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var bar = svg.selectAll(".bar")
    .data(data_in)
    .enter()
    .append("g")
    .attr("class", "bar")
    .attr("transform", function(d, i) {
      return "translate(" + x(i / data_in.length) + "," + y(d.value[value]) + ")";
    });

  bar.append("rect")
    .attr("x", 1)
    .attr("width", width / data_in.length - 1)
    .attr("height", function(d) {
      return height - y(d.value[value]);
    });

  var formatCount = d3.format(",.0f");

  bar.append("text")
    .attr("dy", ".75em")
    .attr("y", 6)
    .attr("x", (width / data_in.length - 1) / 2)
    .attr("text-anchor", "middle")
    .text(function(d) {
      return formatCount(d.value[value]);
    });

  var unique_names = data_in.map(function(d) {
    return d.key;
  });

  var xScale = d3.scale.ordinal().domain(unique_names).rangePoints([0, width]);

  var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom");

  var xTicks = svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("font-size", 10)
    .attr("transform", function(d) {
      return "rotate(-50)"
    });


  var yAxis = d3.svg.axis()
    .ticks(5)
    .scale(y)
    .orient("left");

  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(0,0)")
    .call(yAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("font-size", 10);
}

d3.json("https://tranquil-peak-82564.herokuapp.com/api/v1.0/data/baseball/limit/200/",
  function(error, games_json) {

    var cf = crossfilter(games_json);
    var dim_team = cf.dimension(function(d) { return d.team_id; });
    var dim_team2 = cf.dimension(function(d) { return d.team_id; });
    var dim_ngames = cf.dimension(function(d){ return d.g_all; });
    var dim_player = cf.dimension(function(d){return d.player_id;});
    var dim_player2 = cf.dimension(function(d){return d.player_id;});
    var dim_year = cf.dimension(function(d){return d.year;});
    var dim_year2 = cf.dimension(function(d){return d.year;});
    /* add more dimensions here */
    
    var group_team = dim_team.group();
    var group_team2 = dim_team2.group();
    var group_year = dim_year.group();
    var group_year2 = dim_year2.group();
    var group_ngames = dim_ngames.group();
    var group_player = dim_player.group();
    var group_player2 = dim_player2.group();
    /* add more groups here */
     
    /* 

    */
    
    /* --------------------------------------------------------- 
    
      Add a third and 4th variable to this map reduction
      - the third should be the minimum year
      - the fourth should be the maximum year
      - hint: use inequalities
      
    */
    
    var reduce_init = function() {
      return {
        "count": 0,
        "total": 0,
        "min_year": 0,
        "max_year": 0,
        "num_years": 0,
        "num_teams": 0,
        "num_players": 0,
        "all_years": [],
        "all_teams": new Set(),
        "all_players": new Set()
      };
    }

    var reduce_add = function(p, v, nf) {
      ++p.count;
      p.total += v.g_all;
      if(p.max_year < v.year){ p.max_year = v.year; }
      if(p.min_year < v.year){ p.min_year = v.year; }
      p.all_years.push(v.year); // store an array
      p.num_years = p.all_years.length;
      p.all_teams.add(v.team_id);
      p.all_players.add(v.player_id);
      p.num_teams = p.all_teams.size;
      p.num_players = p.all_players.size;
      return p;
    }

    var reduce_remove = function(p, v, nf) {
      --p.count;
      p.total -= v.g_all;
      p.all_years.splice(p.all_years.indexOf(v.year), 1);
      p.all_teams.delete(v.team_id);
      p.all_players.delete(v.player_id);
      p.max_year = Math.max.apply(null, p.all_years);
      p.min_year = Math.min.apply(null, p.all_years);
      p.num_years = p.all_years.length;
      p.num_teams = p.all_teams.size;
      p.num_players = p.all_players.size;
      return p;
    }
    
    /* --------------------------------------------------------- */
    
    
    group_team2.reduce(reduce_add, reduce_remove, reduce_init);
    group_year2.reduce(reduce_add, reduce_remove, reduce_init);
    group_player2.reduce(reduce_add, reduce_remove, reduce_init);
    /* reduce the more groups here */
    
    var render_plots = function(){
      // count refers to a specific key specified in reduce_init 
      // and updated in reduce_add and reduce_subtract
      // Modify this for the chart to plot the specified variable on the y-axis
      hist(group_team2.top(Infinity), 
        "appearances_by_team", 
        "count", 
        "# of Appearances by Team"
      );
      
      hist(group_year2.top(Infinity), 
        "appearances_by_year", 
        "num_players", 
        "# Players Represented by Year"
      );
      
      hist(group_year2.top(Infinity), 
        "teams_by_year", 
        "num_teams", 
        "# Teams Represented by Year"
      );
      
      hist(group_player2.top(Infinity), 
        "teams_per_player", 
        "num_years", 
        "# Teams Represented per Player"
      );
      /* build more charts here */
      
    }
    
    
    /* --------------------------------------------------------- 
       this is a slider, see the html section above
    */
    var n_games_slider = new Slider(
      "#n_games_slider", {
        "id": "n_games_slider",
        "min": 0,
        "max": 100,
        "range": true,
        "value": [0, 100]
      });
    
    var years_slider = new Slider(
      "#years_slider", {
        "id": "years_slider",
        "min": 1870,
        "max": 1910,
        "range": true,
        "value": [1870, 1910]
      });
      
      var players_slider = new Slider(
      "#players_slider", {
        "id": "players_slider",
        "min": 1,
        "max": 200,
        "focus": true,
        "value": 100
      });
      
      var teams_slider = new Slider(
      "#teams_slider", {
        "id": "teams_slider",
        "min": 1,
        "max": 200,
        "focus": true,
        "value": 100
      });
    
    /* add at least 3 more sliders here */
   
    // this is an event handler for a particular slider
    n_games_slider.on("slide", function(e) {
      d3.select("#n_games_slider_txt").text("min: " + e[0] + ", max: " + e[1]);
      
      // filter based on the UI element
      dim_ngames.filter(e);
      
      // re-render
      render_plots(); 
       
    });
    
       years_slider.on("slide", function(e) {
      d3.select("#years_slider_txt").text("min: " + e[0] + ", max: " + e[1]);
      
      // filter based on the UI element
      dim_year.filter(e);
      
      // re-render
      render_plots(); 
       
    });
    
    
//Display a fixed number of teams and players
      players_slider.on("slide", function(e) {
      d3.select("#players_slider_txt").text(e);
      
      dim_player.filterAll()
      
      temp = dim_player.bottom(e)

      // filter based on the UI element
      dim_player.filter([temp[0].player_id, temp[temp.length-1].player_id]);
      
      //Re-calculate
      group_team2.reduce(reduce_add, reduce_remove, reduce_init);
      group_year2.reduce(reduce_add, reduce_remove, reduce_init);
      group_player2.reduce(reduce_add, reduce_remove, reduce_init);
      
      // re-render
      render_plots(); 
       
    });
    
      teams_slider.on("slide", function(e) {
      d3.select("#teams_slider_txt").text(e);
      
      dim_team.filterAll()
      
      temp = dim_team.bottom(e)
      console.log(temp[0])
      // filter based on the UI element
      dim_team.filter([temp[0].team_id, temp[temp.length-1].team_id]);
      
      //Re-calculate
      group_team2.reduce(reduce_add, reduce_remove, reduce_init);
      group_year2.reduce(reduce_add, reduce_remove, reduce_init);
      group_player2.reduce(reduce_add, reduce_remove, reduce_init);
      
      // re-render
      render_plots(); 
       
    });
    
     /* --------------------------------------------------------- */
     
     
     
     render_plots(); // this just renders the plots for the first time
    
  });
