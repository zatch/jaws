// Based on MelonJS implementation.

var jaws = (function (jaws) {

jaws.TMXMap = function (file, callback) {

    var self   = this,
        loader = new jaws.Assets();

    function _loadXMLDoc(url, callback) {
        var xhttp, xmlDoc, parser;
        if (window.XMLHttpRequest) {
            xhttp = new XMLHttpRequest();
        } else {
            xhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }

        if (xhttp.overrideMimeType) xhttp.overrideMimeType('text/xml');
        xhttp.open("GET", url, true);
        xhttp.onload = function (e) {
            // if (xhttp.responseXML === null) {

                /* TODO 1 : Check if can be better */
                if (window.DOMParser) {
                    parser = new DOMParser();
                    xmlDoc = parser.parseFromString(xhttp.responseText, "text/xml");
                } else // Internet Explorer
                {
                    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = "false";
                    xmlDoc.loadXML(xhttp.responseText);
                }
                

                if(callback) callback(xmlDoc);
            // } else {
                // console.error("XML was loaded but an error occured while processing it.", xhttp.responseXML);
            // }
        };
        xhttp.onerror = function (e) {
            console.error(xhttp.statusText);
        };
        xhttp.send();
        // return xhttp.responseXML;
    }

    function _loadMapAssets(xmlDoc) {
        var tilesets     = map.getElementsByTagName('tileset'),
            mapDirectory = file.substring(0, file.lastIndexOf("/") + 1);
            imgPath      = "";

        for(var i=0, ilen=tilesets.length; i<ilen; i++) {
            imgPath = mapDirectory + tilesets[i].getElementsByTagName('image')[0].attributes.getNamedItem("source").nodeValue;
            loader.add(imgPath);        }
        loader.loadAll({
            onload: function () {
                _onTMXLoad(xmlDoc);
            }
        });
    }

    function _parseProperties(obj, xmlNode) {
        for (var pi = 0; pi < xmlNode.length; pi++) {
            var name = xmlNode[pi].attributes.getNamedItem("name").nodeValue;
            var value = xmlNode[pi].attributes.getNamedItem("value").nodeValue;
            obj.properties[name] = value;
        }
        return true;
    }

    function _decodeBase64AsArray(input, bytes) {
        bytes = bytes || 1;

        // From: goog.string.collapseWhitespace().
        // Since IE doesn't include non-breaking-space (0xa0) in their \s character
        // class (as required by section 7.2 of the ECMAScript spec), we explicitly
        // include it in the regexp to enforce consistent cross-browser behavior.
        input = input.replace(/[\s\xa0]+/g, ' ').replace(/^\s+|\s+$/g, '');


        // TODO: Remove goog.crpt.base64.decodeString() call.
        var dec = _base64Decode(input),
            ar = [],
            i, j, len;

        for (i = 0, len = dec.length / bytes; i < len; i++) {
            ar[i] = 0;
            for (j = bytes - 1; j >= 0; --j) {
                ar[i] += dec.charCodeAt((i * bytes) + j) << (j << 3);
            }
        }
        return ar;
    }

    function _base64Decode(data) {
        //  discuss at: http://phpjs.org/functions/base64_decode/
        // original by: Tyler Akins (http://rumkin.com)
        // improved by: Thunder.m
        // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        //    input by: Aman Gupta
        //    input by: Brett Zamir (http://brett-zamir.me)
        // bugfixed by: Onno Marsman
        // bugfixed by: Pellentesque Malesuada
        // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        //   example 1: base64_decode('S2V2aW4gdmFuIFpvbm5ldmVsZA==');
        //   returns 1: 'Kevin van Zonneveld'
        //   example 2: base64_decode('YQ===');
        //   returns 2: 'a'

        var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
            ac = 0,
            dec = '',
            tmp_arr = [];

        if (!data) {
            return data;
        }

        data += '';

        while (i < data.length) { // unpack four hexets into three octets using index points in b64
            h1 = b64.indexOf(data.charAt(i++));
            h2 = b64.indexOf(data.charAt(i++));
            h3 = b64.indexOf(data.charAt(i++));
            h4 = b64.indexOf(data.charAt(i++));

            bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

            o1 = bits >> 16 & 0xff;
            o2 = bits >> 8 & 0xff;
            o3 = bits & 0xff;

            if (h3 == 64) {
                tmp_arr[ac++] = String.fromCharCode(o1);
            } else if (h4 == 64) {
                tmp_arr[ac++] = String.fromCharCode(o1, o2);
            } else {
                tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
            }
        }

        dec = tmp_arr.join('');

        return dec.replace(/\0+$/, '');
    }

    // Borrowed from jaws.SpriteSheet.
    function _cutImage(image, x, y, width, height) {
        var cut = document.createElement("canvas");
        cut.width = width;
        cut.height = height;

        var ctx = cut.getContext("2d");
        ctx.drawImage(image, x, y, width, height, 0, 0, cut.width, cut.height);

        return cut;
    }

    function _getLayerData(layer) {
        var encoding = null;
        if (layer.getElementsByTagName('data')[0].attributes.getNamedItem("encoding")) {
            encoding = layer.getElementsByTagName('data')[0].attributes.getNamedItem("encoding").nodeValue;
        }
        var compression = null;
        if (layer.getElementsByTagName('data')[0].attributes.getNamedItem("compression")) {
            compression = layer.getElementsByTagName('data')[0].attributes.getNamedItem("compression").nodeValue;
        }
        var retdatas = [];
        switch (compression) {
        case null:
            {
                switch (encoding) {
                case null:
                    {
                        var datas = layer.getElementsByTagName('tile');
                        for (j = 0; j < datas.length; j++) {
                            gid = parseInt(datas[j].attributes.getNamedItem("gid").nodeValue);
                            retdatas.push(gid);
                        }
                        return retdatas;
                        break;
                    }

                case 'base64':
                    {
                        var content = '';
                        for (var x = 0, len = layer.getElementsByTagName('data')[0].childNodes.length; x < len; x++) {
                            content += layer.getElementsByTagName('data')[0].childNodes[x].nodeValue;
                        }
                        retdatas = _decodeBase64AsArray(content, 4);
                        return retdatas;
                        break;
                    }

                default:
                    throw encoding + " encoded TMX Tile Map not supported!";
                    break;
                }
            }

        default:
            throw compression + " compressed TMX Tile Map not supported!";
            break;
        }

        return retdatas;
    }

    self.getTile = function (gid) {
        var ret = self.tiles[gid - 1];
        return ret;
    };

    self.layerAsTileMap = function (layer) {
        var tileMap, i, ilen, tile, sprite;

        // TODO: Dynamically set cell + map dimensions.
        tileMap = new jaws.TileMap({
            cell_size: [self.tilewidth, self.tileheight],
            size     : [self.width, self.height]
            // sortFunction: null
        });

        console.log(layer.tiles);

        for(i=0, ilen=layer.tiles.length; i<ilen; i++) {
            tile = layer.tiles[i];
            tileMap.push(new jaws.Sprite({
                x     : tile.px,
                y     : tile.py,
                width : tile.width,
                height: tile.height,
                image : tile.tile.image
            }));
        }
        return tileMap;
    };

    function _loadTilesets (doc) {
        var imageEls     = doc.getElementsByTagName('image'),
            mapDirectory = file.substring(0, file.lastIndexOf("/") + 1),
            i, ilen;

        for(i=0, ilen=imageEls.length; i<ilen; i++) {
            loader.add(mapDirectory + imageEls[i].attributes.source.value);
        }
        loader.loadAll({
            onload: function () {
                _onTMXLoad(doc);
            }
        });
    }

    var mapdirectory = file.substring(0, file.lastIndexOf("/") + 1);
    
    _loadXMLDoc(file, _loadTilesets);


    function _onTMXLoad(doc) {
        var map = doc.getElementsByTagName("map")[0];
        self.filename = file;
        self.orientation = map.attributes.getNamedItem("orientation").nodeValue;
        self.version = parseFloat(map.attributes.getNamedItem("version").nodeValue);
        self.width = parseInt(map.attributes.getNamedItem("width").nodeValue);
        self.height = parseInt(map.attributes.getNamedItem("height").nodeValue);
        self.tilewidth = parseInt(map.attributes.getNamedItem("tilewidth").nodeValue);
        self.tileheight = parseInt(map.attributes.getNamedItem("tileheight").nodeValue);
        self.properties = [];
        if (map.getElementsByTagName('properties').length) {
            var mapproperties = map.getElementsByTagName('properties')[0].getElementsByTagName('property');
            _parseProperties(self, mapproperties);
        }

        _parseTiles(map);
    }

    function _parseTiles (map, callback) {    
        // Parse tile sets/tiles.
        var tilesets = map.getElementsByTagName('tileset');
        self.tilesets = [];
        self.tiles = [];
        for (var i = 0; i < tilesets.length; i++) {
            var instileset = {};
            instileset.firstgid = parseInt(tilesets[i].attributes.getNamedItem("firstgid").nodeValue);
            instileset.name = tilesets[i].attributes.getNamedItem("name").nodeValue;

            if (tilesets[i].attributes.getNamedItem("spacing")) {
                instileset.spacing = parseInt(tilesets[i].attributes.getNamedItem("spacing").nodeValue);
            } else {
                instileset.spacing = 0;
            }

            if (tilesets[i].attributes.getNamedItem("margin")) {
                instileset.margin = parseInt(tilesets[i].attributes.getNamedItem("margin").nodeValue);
            } else {
                instileset.margin = 0;
            }

            instileset.tilewidth = parseInt(tilesets[i].attributes.getNamedItem("tilewidth").nodeValue);
            instileset.tileheight = parseInt(tilesets[i].attributes.getNamedItem("tileheight").nodeValue);
            instileset.image = {};
            instileset.image.source = mapdirectory + tilesets[i].getElementsByTagName('image')[0].attributes.getNamedItem("source").nodeValue;
            instileset.image.width = parseInt(tilesets[i].getElementsByTagName('image')[0].attributes.getNamedItem("width").nodeValue);
            instileset.image.height = parseInt(tilesets[i].getElementsByTagName('image')[0].attributes.getNamedItem("height").nodeValue);

            //instileset.image.transparencycolor = tilesets[i].getElementsByTagName('image')[0].attributes.getNamedItem("trans").nodeValue;
            tilewidthcount = parseInt(instileset.image.width / instileset.tilewidth);
            tileheightcount = parseInt(instileset.image.height / instileset.tileheight);

            // tiles
            for (var y = 0; y < tileheightcount; y++) {
                for (var x = 0; x < tilewidthcount; x++) {
                    var instile = {};
                    instile.properties = [];
                    instile.tileset = instileset;
                    instile.width = instileset.tilewidth;
                    instile.height = instileset.tileheight;

                    instile.x = x;
                    instile.y = y;
                    instile.px = x * instile.width + instileset.spacing + (x * instileset.margin);
                    instile.py = y * instile.height + instileset.spacing + (y * instileset.margin);
                    instile.gid = parseInt(instileset.firstgid + (x + (y * tilewidthcount)));

                    instile.image = _cutImage(
                        loader.get(instileset.image.source),
                        instile.x,
                        instile.y,
                        instile.width,
                        instile.height
                    );

                    // TODO: Parse frame to jaws.Sprite instead of lime.fill.Frame.
                    // instile.frame = new lime.fill.Frame(instileset.image.source, instile.px, instile.py, instile.width, instile.height);

                    /*
                    instile.sprite = new jaws.Sprite({
                        "image" : loader.get(instileset.image.source),
                        "x"     : instile.px,
                        "y"     : instile.py,
                        "width" : instile.width,
                        "height": instile.height
                    });
                    */
                   
                    self.tiles.push(instile);
                }
            }

            // tiles properties
            var tiles = tilesets[i].getElementsByTagName('tile');
            for (var id = 0; id < tiles.length; id++) {
                var tileid = parseInt(tiles[id].attributes.getNamedItem("id").nodeValue);
                var tileproperties = tiles[id].getElementsByTagName('property');

                _parseProperties(self.tiles[instileset.firstgid + tileid - 1], tileproperties);
            }
            self.tilesets.push(instileset);
        }

        _parseTileLayers(map);
    }

    function _parseTileLayers (map, callback) {
        // Parse tile layers
        var layers = map.getElementsByTagName('layer');
        self.layers = [];
        for (i = 0; i < layers.length; i++) {
            var inslayer = {};
            inslayer.properties = [];
            inslayer.name = layers[i].attributes.getNamedItem("name").nodeValue;
            inslayer.width = parseInt(layers[i].attributes.getNamedItem("width").nodeValue);
            inslayer.height = parseInt(layers[i].attributes.getNamedItem("height").nodeValue);

            var layerproperties = layers[i].getElementsByTagName('property');
            _parseProperties(inslayer, layerproperties);
            inslayer.tiles = [];

            var datas = _getLayerData(layers[i]);
            for (var j = 0; j < datas.length; j++) {
                var gid = parseInt(datas[j]);
                if (gid !== 0) {
                    var inslayertile = {};
                    inslayertile.tile = self.getTile(gid);
                    inslayertile.x = parseInt(j % inslayer.width);
                    inslayertile.y = parseInt(j / inslayer.width);

                    if (self.orientation === "isometric") {
                        inslayertile.px = (inslayertile.x - inslayertile.y) * inslayertile.tile.width * 0.5;
                        inslayertile.py = (inslayertile.y + inslayertile.x) * inslayertile.tile.height * 0.25;
                    } else if (self.orientation === "orthogonal") {
                        inslayertile.px = inslayertile.x * inslayertile.tile.width;
                        inslayertile.py = inslayertile.y * inslayertile.tile.height;
                    } else { 
                        throw self.orientation + " type TMX Tile Map not supported !";
                    }

                    inslayer.tiles.push(inslayertile);
                }
            }
            self.layers.push(inslayer);
        }
        _parseObjectLayers(map);
    }

    function _parseObjectLayers(map) {
        // Parse object layers.
        var objects = map.getElementsByTagName('object');
        self.objects = [];
        for (i = 0; i < objects.length; i++) {
            var object = objects[i];
            var insobject = {};
            insobject.properties = [];
            var poly = object.getElementsByTagName("polyline");
            var elipse = object.getElementsByTagName("ellipse");
            if (poly.length > 0) {
                poly = poly[0];
                insobject.objType = "polyline";
                insobject.polyPoints = [];
                var pAttr = poly.attributes.getNamedItem("points");
                var points = (pAttr ? pAttr.nodeValue : "").split(" ");
                for (var pIndex = 0; pIndex < points.length; ++pIndex) {
                    var xy = points[pIndex].split(",");
                    insobject.polyPoints.push({ x:parseInt(xy[0]), y:parseInt(xy[1]) });
                }

            } else if (elipse.length > 0) {
                insobject.objType = "ellipse";
            } else {
                insobject.objType = "rectangle";
            }
            var objName = object.attributes.getNamedItem("name");
            insobject.name = objName ? objName.nodeValue : "";
            // if gid
            if (object.attributes.getNamedItem("gid")) {
                insobject.gid = parseInt(object.attributes.getNamedItem("gid").nodeValue);
                insobject.tile = self.getTile(insobject.gid);
                insobject.width = insobject.tile.width;
                insobject.height = insobject.tile.height;
                insobject.hastile = true;
            } else {
                // else
                var objWidth = object.attributes.getNamedItem("width");
                insobject.width = parseInt(objWidth ? objWidth.nodeValue : 0);
                var objHeight = object.attributes.getNamedItem("height");
                insobject.height = parseInt(objHeight ? objHeight.nodeValue : 0);
                insobject.hastile = false;
            }

            var xAttr = object.attributes.getNamedItem("x");
            insobject.x = parseInt(xAttr ? xAttr.nodeValue : 0);
            insobject.px = insobject.x;

            var yAttr = object.attributes.getNamedItem("y");
            insobject.y = parseInt(yAttr ? yAttr.nodeValue : 0);
            insobject.py = insobject.y;

            var objectproperties = object.getElementsByTagName('property');
            _parseProperties(insobject, objectproperties);
            self.objects.push(insobject);
        }

        callback(self);
    }
};

return jaws;

})(jaws || {});