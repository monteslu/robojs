var md5 = require('blueimp-md5');
var _ = require('lodash');
var $ = require ('jquery');

var startingWord = 'NodeBots';
var canvas, img, context;

function render(input) {
  renderHash(md5(input || ''));
}

function renderHash(hash) {
  if(!hash && hash.length < 32) {
    hash = md5(hash || '');
  }
  //strip uuid dashes
  hash = hash.replace(/\-/g, '');
  renderBuckets(getBuckets(hash));
}

function getBuckets(hash) {
  var b = new Buffer(hash, 'hex');
  var pairs = _.reduce(b, function(result, value, key) {
      if(key % 2) {
        result.push([b[key-1], b[key]]);
        return result;
      }
      return result;
  }, []);
  return _.map(pairs, function(val) {
    return ((val[0] << 8) + val[1]) % 10;
  });
}

function renderBuckets(buckets) {
  console.log(buckets);

  var bodyStyle = buckets[0];
  var headStyle = buckets[1];
  var eyeStyle = buckets[2];
  var mouthStyle = buckets[3];
  var accStyle = buckets[4];
  var bhColor = buckets[5];
  var emColor = buckets[6];
  var accColor = buckets[7];


  if(img) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.drawImage(img, 300 * bodyStyle, 1500 * bhColor + 900, 300, 300, 0, 0, 300, 300);
    context.drawImage(img, 300 * headStyle, 1500 * bhColor + 1200, 300, 300, 0, 0, 300, 300);
    context.drawImage(img, 300 * mouthStyle, 1500 * emColor, 300, 300, 0, 0, 300, 300);
    context.drawImage(img, 300 * eyeStyle, 1500 * emColor + 300, 300, 300, 0, 0, 300, 300);
    context.drawImage(img, 300 * accStyle, 1500 * accColor + 600, 300, 300, 0, 0, 300, 300);
  }
}


global.render = render;
global.renderHash = renderHash;

$(function(){
  canvas = document.getElementById('canvas');
  context = canvas.getContext('2d');

  $("#hashInput").focus();

  $("#hashInput").bind ("input propertychange", function (e) {
    render($(this).val());
  });

  $("#hashInput").val(startingWord);

  img= new Image();
  img.onload = function () {
     console.info("Image loaded !");
     //do something...
     render(startingWord);
  }
  img.onerror = function () {
     console.error("Cannot load img");
     //do something else...
  }
  img.src = "set1.png";

});
