  var glob_paused=0;
    $(function() {
        var width = 900,
            height = 900;
        var data_types_no=20;
        //var color = d3.scale.category10().domain(d3.range(data_types_no));
        var color=function(entity_type){
            if(entity_type=='Person'){
                return '#d1ebbc';
            }else if(entity_type=='Place'){
                return '#b7d1e7';
            }else if(entity_type=='Organization'){
                return '#da808d';
            }else{
                return '#fdf8ca';
            }
        }
        //clustering point
        var cluster_padding_x=width/4;
        var cluster_padding_y=height/4;
        var foci = [{x: (width/2)-cluster_padding_x, y: (height/2)-cluster_padding_y}, {x: (width/2)+cluster_padding_x, y: (height/2)-cluster_padding_y}, {x: (width/2)-cluster_padding_x, y: (height/2)+cluster_padding_y},{x: (width/2)+cluster_padding_x, y: (height/2)+cluster_padding_y}];
        var foci_category=function(entity_type){
            if(entity_type=='Person'){
                return foci[0];
            }else if(entity_type=='Place'){
                return foci[1];
            }else if(entity_type=='Organization'){
                return foci[2];
            }else{
                return foci[3];
            }
        }
        /*
         var category_no = d3.scale.ordinal()
         .domain(["Person", "Place", "Organization"])
         .range(d3.range(3));
         */
        var category_no=function(entity_type){
            if(entity_type=='Person'){
                return 1;
            }else if(entity_type=='Place'){
                return 2;
            }else if(entity_type=='Organization'){
                return 3;
            }else{
                return 0;
            }
        }
        var force = d3.layout.force()
            .size([width, height])
            .nodes([{}]) // initialize with a single node
            .links([])
            .gravity(0.18)
            .charge(-360)
            .friction(0.94)
            .on("tick", tick);

        var svg = d3.select("#bubblecloud").append("svg")
            .attr("width", width)
            .attr("height", height);
        svg.append("rect")
            .attr("width", width)
            .attr("height", height);

        var nodes = force.nodes(),
            node = svg.selectAll(".node");

        function mouseover() {
            d3.select(this).select("circle")
                .style("stroke-width", 3);
            //d3.select(this).select("text").attr("opacity", 0.9);
            //console.log(d3.select(this).select("text"));
            var n_value=d3.select(this).select("text")[0][0].textContent;
            var uri=d3.select(this).select("text")[0][0].__data__.uri;
            var tmp=uri.split('http://dbpedia.org/resource/');
            var desc='';
            $.ajax({
                type: "GET",
                dataType: "json",
                url: "http://lookup.dbpedia.org/api/search/PrefixSearch?MaxHits=1&QueryString="+tmp[1],
                async:false
            }).done(function( data ) {
                //console.log(data)
                    desc=data.results[0].description
            });
            if(!desc){
                desc='';
            }
            $(d3.select(this).select("circle")).popover({
                'title': '<b>'+n_value+'</b>',
                'html':true,
                'content': '<a href="'+uri+'">'+uri+'</a><div style="text-align:justify">'+desc+'</div>',
                'container':'body'
            }).popover("show")
        }

        function mouseout() {
            if(! d3.select(this).classed('node-selected')){
                d3.select(this).select("circle")
                .style("stroke-width", 1);
                d3.select(this).select("text").attr("opacity", 0);
            }
            $('.popover').remove();
        }
        function mousedown() {
            if(! d3.select(this).classed('node-selected')){
                d3.select(this).select("circle")
                    .style("stroke-width", 3);
                d3.select(this).select("text")
                   // .attr("opacity", 0)
                   // .attr("style","font-size:5px;")
                    //.transition()
                 //  .duration(300)
                    .attr("style","font-size:1.4em;")
                     .attr("opacity", 0.9)
                d3.select(this).classed('node-selected',true);
            }else{
                d3.select(this).classed('node-selected',false);
                d3.select(this).select("text").attr("opacity", 0);
            }

        }
        function tick(e) {
            /*        node.attr("transform", function(d) { return "translate(" + d.x  + "," + d.y+ ")"; }); */
            var k = .1 * e.alpha;

            // Push nodes toward their designated focus.
            nodes.forEach(function(o, i) {
                o.y += (foci_category(o.category).y - o.y) * k;
                o.x += (foci_category(o.category).x - o.x) * k;
            });

            node.select('circle')
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
            node.select('text')
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; });
        }
        function restart() {
            node = node.data(nodes);

            var nn=node.enter().insert('g').attr("class", "node")
                .on("mouseover", mouseover)
                .on("mouseout", mouseout)
                .on("mousedown", mousedown)
                .call(force.drag)
            var c_added=nn.append("circle")
                .attr("id",function(d){return d.slug_text;})
                .attr("class", "node-circle")
                .attr("r", 1)
                .style("stroke","#999490")
                .style("stroke-width","1")
                .style("fill",function(d){return color(d.category)})
                .transition()
                .duration(500)
                .style("opacity",function(d){return opacScale(d.proportion)})
                .attr("r",function(d){return d.r});
            nn.append("text")
                .attr("id",function(d){return 't_'+d.slug_text;})
                .attr("opacity", 0)
                .attr("text-anchor", "middle")
                .attr("class", "node-text")
                .attr("style","font-size:1.4em;")
                // .attr("style","font-size:5px;")
                .text(function(d){return d.name;})
            // .transition()
            // .duration(500)
            // .attr("style","font-size:1.4em;")

            force.start();
        }
        var rScale = d3.scale.log ()
            .domain([1, 1000])
            .range([12, 80]);
        var opacScale = d3.scale.log()
            .domain([0, 1])
            .range([0.25, 1]);
        var socket = io.connect(window.location.hostname);
        socket.on('filter', function(r_nodes) {
            //gets the entities to be removed
            console.log('Filtering nodes...');
            /*
             console.log(r_nodes);
            $.each(r_nodes,function(i, v) {
                d3.select("#bubblecloud svg").select('.node-circle[id="' + convertToSlug(i) + '"]').transition().attr('r','3');
            })

            nodes = $.grep(nodes, function( v, i ) {
                return ( r_nodes[v.name]==undefined);
            });
            */
        });
        socket.on('data', function(data) {
            //console.log(data);
            //console.log(data.recent_tweets);
            var one_node_already_inserted=0;
            var total = data.total;
			var symbols_no=Object.keys(data.symbols).length;
			var max_ent=400;
			if(symbols_no>max_ent){
				pauseAnalyzing();
				alert('The demo is limited to '+max_ent+' entities! contact us for more info: khalili@informatik.uni-leipzig.de');
			}

            var avg_no=total/symbols_no;
            var slug_text='';
            $('#symbols_no').html(symbols_no).addClass("animated bounceIn");
            $('#tweets_no').html(data.tweets_no).addClass("animated bounceIn");
            if(data.tweets_no>0 && !glob_paused){
                establishPauseMode();
            }else{
                glob_paused=0;
            }
            $('#hashtag').html(' (#'+data.search_for.join()+')').addClass("animated bounceIn");
            $('.tweet').removeClass('animated').removeClass('flash');
            $('.r_entity').css('background-color','')
            $.each(data.recent_tweets,function(i,v){
                $('#tweets').prepend('<div class="tweet animated slideInDown recent"><div class="tweet-date">'+v.date+'</div>'+v.text+'</div>').linkify({target: '_blank'});
            });
            $('.recent .r_entity').mouseover(function(){
                $(this).css('background-color','orange')
                var id=convertToSlug($(this).text());
                d3.select("#bubblecloud svg").selectAll('#t_'+id).attr('opacity',0.9);
            }).mouseout(function(){
                    $(this).css('background-color','')
                    var id=convertToSlug($(this).text());
                    d3.select("#bubblecloud svg").selectAll('#t_'+id).attr('opacity',0);
                })
            for (var key in data.symbols) {
                var val = data.symbols[key].count / total;
                if (isNaN(val)) {
                    val = 0;
                }
                slug_text=convertToSlug(key);
                //console.log(d3.select("#bubblecloud svg").selectAll('.node'));
                if(!d3.select("#bubblecloud svg").selectAll('.node-circle[id="' + slug_text + '"]').size()){
                    var start_x=width/2;
                    var start_y=height/2;
                    if(one_node_already_inserted>0){
                        //prevent collision
                        start_y=start_y-(one_node_already_inserted*15);
                    }
                    //var category=Math.floor(20*Math.random());
                    var c_size=rScale(data.symbols[key].count);
                    var uri=data.symbols[key].uri;
                    var node = {x: start_x, y:start_y, name:key,n_weight:data.symbols[key].count, category:data.symbols[key].type, r:c_size, proportion:val,slug_text:slug_text,uri:uri},
                        n = nodes.push(node);
                    one_node_already_inserted++;
                }else{
                    var new_size=rScale(data.symbols[key].count);
                    if(d3.select("#bubblecloud svg").select('.node-circle[id="' + slug_text + '"]').attr('r')!=new_size){
                        d3.select("#bubblecloud svg").select('.node-circle[id="' + slug_text + '"]').attr('r',new_size/2).transition().duration(700).attr('r',new_size);
                    }
                }
            }
            restart();
            $('#last-update').text(new Date().toTimeString());
        });
        socket.on('stop', function(data) {
            stopAnalyzing();
        });
        socket.on('pause', function(data) {
            glob_paused=1;
            pauseAnalyzing();
        });
    })
    function startAnalyzing(){
        glob_paused=0;
        var terms=$('#keyword').val();
        if(!$.trim(terms)){
            return 0;
        }
        establishPauseMode();
        var socket2 = io.connect(window.location.hostname);
        socket2.emit('startA', {keywords:terms.split(',')});
    }
    function stopAnalyzing(){
        $('#reset_btn').addClass('animated bounceIn')
        var socket2 = io.connect(window.location.hostname);
        socket2.emit('stopA', {});
        setTimeout(function(){
            socket2.emit('removeAll', {});
            d3.select("#bubblecloud svg").selectAll('g').remove();
            $('#tweets').empty();
        },1000)
        $('#process_btn i').removeClass('glyphicon-pause').addClass('glyphicon-play');
        $('#process_btn').removeClass('btn-warning').addClass('btn-success').attr('title','start').removeClass('bounceIn').addClass('animated bounceIn').attr('onclick','startAnalyzing();');
    }
    function pauseAnalyzing(){
        var socket2 = io.connect(window.location.hostname);
        socket2.emit('pauseA', {});
        $('#process_btn i').removeClass('glyphicon-pause').addClass('glyphicon-play');
        $('#process_btn').removeClass('btn-warning').addClass('btn-success').attr('title','start').removeClass('bounceIn').addClass('animated bounceIn').attr('onclick','startAnalyzing();');
    }
    function removeAllEntities(){
        var socket2 = io.connect(window.location.hostname);
        socket2.emit('removeAll', {});
    }
    function establishPauseMode(){
        $('#process_btn i').removeClass('glyphicon-play').addClass('glyphicon-pause');
        $('#process_btn').removeClass('btn-success').addClass('btn-warning').attr('title','pause').addClass('animated bounceIn').attr('onclick','pauseAnalyzing();');
    }