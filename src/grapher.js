(function(){ 
  
  grapher = { version: "0.0.1" };

  grapher.graph = function(data) {

    var array = data;
    graph = {};

    graph.new_data = function(points) {
      new_data(points);
      update();
    };

    graph.add_point = function(p) {
      add_point(p);
    };
    
    graph.add_canvas_point = function(p) {
      add_canvas_point(p);
    };
    
    graph.initialize_canvas = function() {
      initialize_canvas();
    };
    
    graph.show_canvas = function() {
      show_canvas();
    };

    graph.hide_canvas = function() {
      hide_canvas();
    };
    
    graph.clear_canvas = function() {
      clear_canvas();
    };

    var size = [500, 350],
        padding = [20, 30, 20, 40], // top right bottom left
        mw = size[0] - padding[1] - padding[3],
        mh = size[1] - padding[0] - padding[2],
        tx = function(d) { return "translate(" + x(d) + ",0)"; },
        ty = function(d) { return "translate(0," + y(d) + ")"; },
        stroke = function(d) { return d ? "#ccc" : "#666"; },
        points = indexedData(array, 0),
        x = d3.scale.linear()
            .domain([0, 5000])
            .range([0, mw]),
        // drag x-axis logic
        downscalex = x.copy(),
        downx = Math.NaN,
        // y-scale (inverted domain)
        y = d3.scale.linear()
            .domain([2.2, 2.0])
            .range([0, mh]),
        line = d3.svg.line()
            .x(function(d, i) { return x(points[i].x); })
            .y(function(d, i) { return y(points[i].y); }),
        // drag x-axis logic
        downscaley = y.copy(),
        downy = Math.NaN,
        dragged = null,
        selected = points[0];
    
    var plot, gcanvas, gctx;
    
    var chart = document.getElementById("chart");
 
    var vis = d3.select("#chart").append("svg:svg")
        .attr("width", size[0] + padding[3] + padding[1])
        .attr("height", size[1] + padding[0] + padding[2])
        // .style("background-fill", "#FFEEB6")
        .append("svg:g")
          .attr("transform", "translate(" + padding[3] + "," + padding[0] + ")");
 
    var plot = vis.append("svg:rect")
        .attr("width", size[0])
        .attr("height", size[1])
        // .attr("stroke", "none")
        .style("fill", "#EEEEEE")
        .attr("pointer-events", "all")
        .call(d3.behavior.zoom().on("zoom", redraw))
        .on("mousedown", function() {
          if (d3.event.altKey) {
              points.push(selected = dragged = d3.svg.mouse(vis.node()));
              update();
              d3.event.preventDefault();
              d3.event.stopPropagation();
          }
        });
 
    vis.append("svg:path")
        .attr("class", "line")
        .attr("d", line(points));

    initialize_canvas();

    // variables for speeding up dynamic plotting
    var line_path = vis.select("path")[0][0];
    var line_seglist = line_path.pathSegList;
    var vis_node = vis.node();
    var cpoint = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    cpoint.setAttribute("cx", 1);
    cpoint.setAttribute("cy", 1);
    cpoint.setAttribute("r",  1);
    
    d3.select(window)
        .on("mousemove", mousemove)
        .on("mouseup", mouseup)
        .on("keydown", keydown);

    function new_data(d) {
      points = indexedData(d, 0)
    };
    
    // custom generation of line path 'd' attribute string
    // using memoized attr_str ... not much faster than d3
    var generate_path_attribute = function () {
      var attr_str = '';
      var gen = function(pts, x, y) {
        var result = attr_str, 
            i = -1, 
            n = pts.length, 
            path = [],
            value;
        if (result.length == 0) {
          path.push("M",
            x.call(self, pts[0].x, 0), ",", 
            y.call(self, pts[0].y, 0));
          i++
        };
        while (++i < n) path.push("L",
          x.call(self, pts[i].x, i), ",", 
          y.call(self, pts[i].y, i)); 
        return attr_str += path.join("");
      };
      return gen;
    }();
    
    function add_point(p) {
      var len = points.length;
      var point = { x: len, y: p };
      points.push(point);
      var newx = x.call(self, len, len);
      var newy = y.call(self, p, len);
      line_seglist.appendItem(line_path.createSVGPathSegLinetoAbs(newx, newy));
    };
    
    function add_canvas_point(p) {
      var len = points.length;
      var oldx = x.call(self, len-1, len-1);
      var oldy = y.call(self, points[len-1].y, len-1);
      var point = { x: len, y: p };
      points.push(point);
      var newx = x.call(self, len, len);
      var newy = y.call(self, p, len);
      gctx.beginPath();
      gctx.moveTo(oldx, oldy);
      gctx.lineTo(newx, newy);
      gctx.closePath();
      gctx.stroke();
      // FIXME: FireFox bug
    };

    function clear_canvas() {
      gctx.fillStyle = "rgba(0,255,0, 0.05)";
      gctx.fillRect(0, 0, gcanvas.width, gcanvas.height);
    };
    
    function show_canvas() {
      gcanvas.style.zIndex = 100;
    };

    function hide_canvas() {
      gcanvas.style.zIndex = -100;
    };

    function initialize_canvas() {
      plot = {}
      plot.rect = chart.children[0].getElementsByTagName("rect")[0]
      plot.width = plot.rect.width['baseVal'].value
      plot.height = plot.rect.height['baseVal'].value
      plot.left = plot.rect.getCTM().e
      plot.top = plot.rect.getCTM().f

      gcanvas = document.createElement('canvas');
      chart.appendChild(gcanvas);
      gcanvas.style.position = 'absolute'
      gcanvas.width = plot.width;
      gcanvas.height = plot.height;
      gcanvas.offsetLeft = plot.left;
      gcanvas.offsetTop = plot.top;
      gcanvas.style.left = plot.left + 'px'
      gcanvas.style.top = plot.top + 'px'
      gctx = gcanvas.getContext( '2d' );
      gctx.globalCompositeOperation = "destination-atop";
      gctx.lineWidth = 1;
      gctx.fillStyle = "rgba(0,255,0, 0.05)";
      gctx.fillRect(0, 0, gcanvas.width, gcanvas.height);
      gctx.strokeStyle = "rgba(255,65,0, 1.0)";
      gcanvas.style.border = 'solid 1px red'
      gcanvas.style.zIndex = -100
    };

    function update() {
      var lines = vis.select("path").attr("d", line(points));
 
      var circle = vis.selectAll("circle")
          .data(points, function(d) { return d; });
 
      circle.enter().append("svg:circle")
          .attr("class", function(d) { return d === selected ? "selected" : null; })
          .attr("cx",    function(d) { return x(d.x); })
          .attr("cy",    function(d) { return y(d.y); })
          .attr("r", 1.0)
          .on("mousedown", function(d) {
            selected = dragged = d;
            update();
          });
 
      circle
          .attr("class", function(d) { return d === selected ? "selected" : null; })
          .attr("cx",    function(d) { return x(d.x); })
          .attr("cy",    function(d) { return y(d.y); });
 
      circle.exit().remove();
 
      if (d3.event && d3.event.keyCode) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
      }
    }
 
    function mousemove() {
      if (!dragged) return;
      var m = d3.svg.mouse(vis.node());
      dragged.x = x.invert(Math.max(0, Math.min(size[0], m[0])));
      dragged.y = y.invert(Math.max(0, Math.min(size[1], m[1])));
      update();
    }
 
    function mouseup() {
      if (!dragged) return;
      mousemove();
      dragged = null;
    }
 
    function keydown() {
      if (!selected) return;
      switch (d3.event.keyCode) {
        case 8: // backspace
        case 46: { // delete
          var i = points.indexOf(selected);
          points.splice(i, 1);
          selected = points.length ? points[i > 0 ? i - 1 : 0] : null;
          update();
          break;
        }
      }
    }
 
    function redraw() {
      if (d3.event && d3.event.transform && isNaN(downx) && isNaN(downy)) {
          d3.event.transform(x, y);
      };
 
      var fx = x.tickFormat(10),
          fy = y.tickFormat(10);
 
      // Regenerate x-ticks…
      var gx = vis.selectAll("g.x")
          .data(x.ticks(10), String)
          .attr("transform", tx);
 
      gx.select("text")
          .text(fx);
 
      var gxe = gx.enter().insert("svg:g", "a")
          .attr("class", "x")
          .attr("transform", tx);
 
      gxe.append("svg:line")
          .attr("stroke", stroke)
          .attr("y1", 0)
          .attr("y2", size[1]);
 
      gxe.append("svg:text")
          .attr("y", size[1])
          .attr("dy", "1em")
          .attr("text-anchor", "middle")
          .text(fx)
          .on("mouseover", function(d) { d3.select(this).style("font-weight", "bold");})
          .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
          .on("mousedown", function(d) {
               var p = d3.svg.mouse(vis[0][0]);
               downx = x.invert(p[0]);
               downscalex = null;
               downscalex = x.copy();
               // d3.behavior.zoom().off("zoom", redraw);
          });
 
      gx.exit().remove();
 
      // Regenerate y-ticks…
      var gy = vis.selectAll("g.y")
          .data(y.ticks(10), String)
          .attr("transform", ty);
 
      gy.select("text")
          .text(fy);
 
      var gye = gy.enter().insert("svg:g", "a")
          .attr("class", "y")
          .attr("transform", ty)
          .attr("background-fill", "#FFEEB6");
 
      gye.append("svg:line")
          .attr("stroke", stroke)
          .attr("x1", 0)
          .attr("x2", size[0]);
 
      gye.append("svg:text")
          .attr("x", -3)
          .attr("dy", ".35em")
          .attr("text-anchor", "end")
          .text(fy)
          .on("mouseover", function(d) { d3.select(this).style("font-weight", "bold");})
          .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
          .on("mousedown", function(d) {
               var p = d3.svg.mouse(vis[0][0]);
               downy = y.invert(p[1]);
               downscaley = y.copy();
               // d3.behavior.zoom().off("zoom", redraw);
          });
 
      gy.exit().remove();
      update();
    }
    
    function indexedData(array, initial_index) {
      var i = 0,
          start_index = initial_index || 0,
          n = array.length,
          points = [];
      for (i = 0; i < n;  i++) {
        points.push( { x: i+start_index, y: array[i] } )
      };
      return points;
    };
 
    // attach the mousemove and mouseup to the body
    // in case one wonders off the axis line
 
    d3.select('body')
      .on("mousemove", function(d) {
        var p = d3.svg.mouse(vis[0][0]);
        if (!isNaN(downx)) {
          var rupx = downscalex.invert(p[0]),
            xaxis1 = downscalex.domain()[0],
            xaxis2 = downscalex.domain()[1],
            xextent = xaxis2 - xaxis1;
          if (rupx != 0) {
              var changex, new_domain;
              changex = 1 + (downx / rupx - 1) * (xextent/(downx-xaxis1))/2;
              new_domain = [xaxis1, xaxis1 + (xextent * changex)];
              x.domain(new_domain);
              redraw();
          }
          d3.event.preventDefault();
          d3.event.stopPropagation();
        };
        if (!isNaN(downy)) {
            rupy = downscaley.invert(p[1]),
            yaxis1 = downscaley.domain()[1],
            yaxis2 = downscaley.domain()[0],
            yextent = yaxis2 - yaxis1;
          if (rupy != 0) {
              var changey, new_domain;
              changey = 1 + (rupy / downy - 1) * (yextent/(downy-yaxis2));
              new_domain = [yaxis1 + (yextent * changey), yaxis1];
              y.domain(new_domain);
              redraw();
          }
          d3.event.preventDefault();
          d3.event.stopPropagation();
        }
      })
      .on("mouseup", function(d) {
          if (!isNaN(downx)) {
              redraw();
              downx = Math.NaN;
              d3.event.preventDefault();
              d3.event.stopPropagation();
              // graph.call(d3.behavior.zoom().on("zoom", redraw));
          };
          if (!isNaN(downy)) {
              redraw();
              downy = Math.NaN;
              d3.event.preventDefault();
              d3.event.stopPropagation();
              // graph.call(d3.behavior.zoom().on("zoom", redraw));
          };
          // d3.event.preventDefault();
          // d3.event.stopPropagation();
      });
 
    redraw();
    return graph;
  };
    
})();