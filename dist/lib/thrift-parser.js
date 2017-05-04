'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var path = require('path');

var ThriftFileParsingError = function (_Error) {
  _inherits(ThriftFileParsingError, _Error);

  function ThriftFileParsingError(message) {
    _classCallCheck(this, ThriftFileParsingError);

    var _this = _possibleConstructorReturn(this, (ThriftFileParsingError.__proto__ || Object.getPrototypeOf(ThriftFileParsingError)).call(this, message));

    _this.name = 'THRIFT_FILE_PARSING_ERROR';
    return _this;
  }

  return ThriftFileParsingError;
}(Error);

module.exports = function (buffer) {
  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;


  buffer = new Buffer(buffer);

  var readAnyOne = function readAnyOne() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var beginning = offset;
    for (var i = 0; i < args.length; i++) {
      try {
        return args[i]();
      } catch (ignore) {
        offset = beginning;
        continue;
      }
    }
    offset = beginning;
    throw 'Unexcepted Token';
  };

  var readUntilThrow = function readUntilThrow(transaction, key) {
    var receiver = key ? {} : [];
    var beginning = void 0;
    for (;;) {
      try {
        beginning = offset;
        var result = transaction();
        key ? receiver[result[key]] = result : receiver.push(result);
      } catch (ignore) {
        offset = beginning;
        return receiver;
      }
    }
  };

  var readKeyword = function readKeyword(word) {
    for (var i = 0; i < word.length; i++) {
      if (buffer[offset + i] !== word.charCodeAt(i)) {
        throw 'Unexpected token "' + word + '"';
      }
    }
    offset += word.length;
    readSpace();
    return word;
  };

  var readCharCode = function readCharCode(code) {
    if (buffer[offset] !== code) throw 'Unexpected charCode';
    offset++;
    readSpace();
    return code;
  };

  var readNoop = function readNoop() {};

  var readCommentMultiple = function readCommentMultiple() {
    var i = 0;
    if (buffer[offset + i++] !== 47 || buffer[offset + i++] !== 42) return false;
    do {
      while (offset + i < buffer.length && buffer[offset + i++] !== 42) {}
    } while (offset + i < buffer.length && buffer[offset + i] !== 47);
    offset += i + 1;
    return true;
  };

  var readCommentSharp = function readCommentSharp() {
    var i = 0;
    if (buffer[offset + i++] !== 35) return false;
    while (buffer[offset + i] !== 10 && buffer[offset + i] !== 13) {
      offset++;
    }offset += i;
    return true;
  };

  var readCommentDoubleSlash = function readCommentDoubleSlash() {
    var i = 0;
    if (buffer[offset + i++] !== 47 || buffer[offset + i++] !== 47) return false;
    while (buffer[offset + i] !== 10 && buffer[offset + i] !== 13) {
      offset++;
    }offset += i;
    return true;
  };

  var readSpace = function readSpace() {
    for (;;) {
      var byte = buffer[offset];
      if (byte === 13 || byte === 10 || byte === 32 || byte === 9) {
        offset++;
      } else {
        if (!readCommentMultiple() && !readCommentSharp() && !readCommentDoubleSlash()) return;
      }
    }
  };

  var readComma = function readComma() {
    if (buffer[offset] === 44 || buffer[offset] === 59) {
      // , or ;
      offset++;
      readSpace();
      return ',';
    }
  };

  var readTypedef = function readTypedef() {
    var subject = readKeyword('typedef');
    var type = readType();
    var name = readName();
    readComma();
    return { subject: subject, type: type, name: name };
  };

  var readType = function readType() {
    return readAnyOne(readTypeMap, readTypeList, readTypeNormal);
  };

  var readTypeMap = function readTypeMap() {
    var name = readName();
    readCharCode(60); // <
    var keyType = readType();
    readComma();
    var valueType = readType();
    readCharCode(62); // >
    return { name: name, keyType: keyType, valueType: valueType };
  };

  var readTypeList = function readTypeList() {
    var name = readName();
    readCharCode(60); // <
    var valueType = readType();
    readCharCode(62); // >
    return { name: name, valueType: valueType };
  };

  var readTypeNormal = function readTypeNormal() {
    return readName();
  };

  var readName = function readName() {
    var i = 0;
    var byte = buffer[offset];
    while (byte >= 97 && byte <= 122 || // a-z
    byte === 46 || // .
    byte === 95 || // _
    byte >= 65 && byte <= 90 || // A-Z
    byte >= 48 && byte <= 57 // 0-9
    ) {
      byte = buffer[offset + ++i];
    }if (i === 0) throw 'Unexpected token';
    var value = buffer.toString('utf8', offset, offset += i);
    readSpace();
    return value;
  };

  var readScope = function readScope() {
    var i = 0;
    var byte = buffer[offset];
    while (byte >= 97 && byte <= 122 || // a-z
    byte === 95 || // _
    byte >= 65 && byte <= 90 || // A-Z
    byte >= 48 && byte <= 57 || // 0-9
    byte === 42 // *
    ) {
      byte = buffer[offset + ++i];
    }if (i === 0) throw 'Unexpected token';
    var value = buffer.toString('utf8', offset, offset += i);
    readSpace();
    return value;
  };

  var readNumberValue = function readNumberValue() {
    var result = [];
    if (buffer[offset] === 45) {
      // -
      result.push(buffer[offset]);
      offset++;
    }

    for (;;) {
      var byte = buffer[offset];
      if (byte >= 48 && byte <= 57 || byte === 46) {
        offset++;
        result.push(byte);
      } else {
        if (result.length) {
          readSpace();
          return +String.fromCharCode.apply(String, result);
        } else {
          throw 'Unexpected token ' + String.fromCharCode(byte);
        }
      }
    }
  };

  var readEnotationValue = function readEnotationValue() {
    var result = [];
    if (buffer[offset] === 45) {
      // -
      result.push(buffer[offset]);
      offset++;
    }

    for (;;) {
      var byte = buffer[offset];
      if (byte >= 48 && byte <= 57 || byte === 46) {
        result.push(byte);
        offset++;
      } else {
        break;
      }
    }

    if (buffer[offset] !== 69 && buffer[offset] !== 101) throw 'Unexpected token'; // E or e
    result.push(buffer[offset]);
    offset++;

    for (;;) {
      var _byte = buffer[offset];
      if (_byte >= 48 && _byte <= 57) {
        // 0-9
        offset++;
        result.push(_byte);
      } else {
        if (result.length) {
          readSpace();
          return +String.fromCharCode.apply(String, result);
        } else {
          throw 'Unexpected token ' + String.fromCharCode(_byte);
        }
      }
    }
  };

  var readHexadecimalValue = function readHexadecimalValue() {
    var result = [];
    if (buffer[offset] === 45) {
      // -
      result.push(buffer[offset]);
      offset++;
    }

    if (buffer[offset] !== 48) throw 'Unexpected token'; // 0
    result.push(buffer[offset]);
    offset++;

    if (buffer[offset] !== 88 && buffer[offset] !== 120) throw 'Unexpected token'; // x or X
    result.push(buffer[offset]);
    offset++;

    for (;;) {
      var byte = buffer[offset];
      if (byte >= 48 && byte <= 57 || // 0-9
      byte >= 65 && byte <= 70 || // A-F
      byte >= 97 && byte <= 102 // a-f
      ) {
          offset++;
          result.push(byte);
        } else {
        if (result.length) {
          readSpace();
          return +String.fromCharCode.apply(String, result);
        } else {
          throw 'Unexpected token ' + String.fromCharCode(byte);
        }
      }
    }
  };

  var readBooleanValue = function readBooleanValue() {
    return JSON.parse(readAnyOne(function () {
      return readKeyword('true');
    }, function () {
      return readKeyword('false');
    }));
  };

  var readRefValue = function readRefValue() {
    var list = [readName()];
    readUntilThrow(function () {
      readCharCode(46); // .
      list.push(readName());
    });
    return { '=': list };
  };

  var readStringValue = function readStringValue() {
    var receiver = [];
    var start = void 0;
    for (;;) {
      var byte = buffer[offset++];
      if (receiver.length) {
        if (byte === start) {
          // " or '
          receiver.push(byte);
          readSpace();
          return new Function('return ' + String.fromCharCode.apply(String, receiver))();
        } else if (byte === 92) {
          // \
          receiver.push(byte);
          offset++;
          receiver.push(buffer[offset++]);
        } else {
          receiver.push(byte);
        }
      } else {
        if (byte === 34 || byte === 39) {
          start = byte;
          receiver.push(byte);
        } else {
          throw 'Unexpected token ILLEGAL';
        }
      }
    }
  };

  var readListValue = function readListValue() {
    readCharCode(91); // [
    var list = readUntilThrow(function () {
      var value = readValue();
      readComma();
      return value;
    });
    readCharCode(93); // ]
    return list;
  };

  var readMapValue = function readMapValue() {
    readCharCode(123); // {
    var list = readUntilThrow(function () {
      var key = readValue();
      readCharCode(58); // :
      var value = readValue();
      readComma();
      return { key: key, value: value };
    });
    readCharCode(125); // }
    return list;
  };

  var readValue = function readValue() {
    return readAnyOne(readHexadecimalValue, // This coming before readNumberValue is important, unfortunately
    readEnotationValue, // This also needs to come before readNumberValue
    readNumberValue, readStringValue, readBooleanValue, readListValue, readMapValue, readRefValue);
  };

  var readConst = function readConst() {
    var subject = readKeyword('const');
    var type = readType();
    var name = readName();
    var value = readAssign();
    readComma();
    return { subject: subject, type: type, name: name, value: value };
  };

  var readEnum = function readEnum() {
    var subject = readKeyword('enum');
    var name = readName();
    var items = readEnumBlock();
    return { subject: subject, name: name, items: items };
  };

  var readEnumBlock = function readEnumBlock() {
    readCharCode(123); // {
    var receiver = readUntilThrow(readEnumItem);
    readCharCode(125); // }
    return receiver;
  };

  var readEnumItem = function readEnumItem() {
    var name = readName();
    var value = readAssign();
    readComma();
    return { name: name, value: value };
  };

  var readAssign = function readAssign() {
    var beginning = offset;
    try {
      readCharCode(61); // =
      return readValue();
    } catch (ignore) {
      offset = beginning;
    }
  };

  var readStruct = function readStruct() {
    var subject = readKeyword('struct');
    var name = readName();
    var items = readStructLikeBlock();
    return { subject: subject, name: name, items: items };
  };

  var readStructLikeBlock = function readStructLikeBlock() {
    readCharCode(123); // {
    var receiver = readUntilThrow(readStructLikeItem);
    readCharCode(125); // }
    return receiver;
  };

  var readStructLikeItem = function readStructLikeItem() {
    var id = void 0;
    try {
      id = readNumberValue();
      readCharCode(58); // :
    } catch (err) {}

    var option = readAnyOne(function () {
      return readKeyword('required');
    }, function () {
      return readKeyword('optional');
    }, readNoop);
    var type = readType();
    var name = readName();
    var defaultValue = readAssign();
    readComma();
    var result = { id: id, type: type, name: name };
    if (option !== void 0) result.option = option;
    if (defaultValue !== void 0) result.defaultValue = defaultValue;
    return result;
  };

  var readUnion = function readUnion() {
    var subject = readKeyword('union');
    var name = readName();
    var items = readStructLikeBlock();
    return { subject: subject, name: name, items: items };
  };

  var readException = function readException() {
    var subject = readKeyword('exception');
    var name = readName();
    var items = readStructLikeBlock();
    return { subject: subject, name: name, items: items };
  };

  var readService = function readService() {
    var subject = readKeyword('service');
    var name = readName();
    var items = readServiceBlock();
    return { subject: subject, name: name, items: items };
  };

  var readNamespace = function readNamespace() {
    var subject = readKeyword('namespace');
    var name = readScope();
    var serviceName = readRefValue()['='].join('.');
    return { subject: subject, name: name, serviceName: serviceName };
  };

  var readInclude = function readInclude() {
    var subject = readKeyword('include');
    readSpace();
    var includePath = readQuotation();
    var name = path.basename(includePath, '.thrift');
    readSpace();
    return { subject: subject, name: name, path: includePath };
  };

  var readQuotation = function readQuotation() {
    if (buffer[offset] === 34 || buffer[offset] === 39) {
      offset++;
    } else {
      throw 'include error';
    }
    var i = offset;
    while (buffer[i] !== 34 && buffer[i] !== 39) {
      i++;
    }
    if (buffer[i] === 34 || buffer[i] === 39) {
      var value = buffer.toString('utf8', offset, i);
      offset = i + 1;
      return value;
    } else {
      throw 'include error';
    }
  };

  var readServiceBlock = function readServiceBlock() {
    readCharCode(123); // {
    var receiver = readUntilThrow(readServiceItem, 'name');
    readCharCode(125); // }
    return receiver;
  };

  var readOneway = function readOneway() {
    return readKeyword('oneway');
  };

  var readServiceItem = function readServiceItem() {
    var oneway = !!readAnyOne(readOneway, readNoop);
    var type = readType();
    var name = readName();
    var args = readServiceArgs();
    var throws = readServiceThrow();
    readComma();
    return { type: type, name: name, args: args, throws: throws, oneway: oneway };
  };

  var readServiceArgs = function readServiceArgs() {
    readCharCode(40); // (
    var receiver = readUntilThrow(readStructLikeItem);
    readCharCode(41); // )
    readSpace();
    return receiver;
  };

  var readServiceThrow = function readServiceThrow() {
    var beginning = offset;
    try {
      readKeyword('throws');
      return readServiceArgs();
    } catch (ignore) {
      offset = beginning;
      return [];
    }
  };

  var readSubject = function readSubject() {
    return readAnyOne(readTypedef, readConst, readEnum, readStruct, readUnion, readException, readService, readNamespace, readInclude);
  };

  var readThrift = function readThrift() {
    readSpace();
    var storage = {};
    for (;;) {
      try {
        var block = readSubject();
        var subject = block.subject,
            name = block.name;

        if (!storage[subject]) storage[subject] = {};
        delete block.subject;
        delete block.name;
        switch (subject) {
          case 'exception':
          case 'service':
          case 'struct':
            storage[subject][name] = block.items;
            break;
          default:
            storage[subject][name] = block;
        }
      } catch (message) {
        console.error('\x1B[31m' + buffer.slice(offset, offset + 50) + '\x1B[0m'); // eslint-disable-line no-console
        throw new ThriftFileParsingError(message);
      } finally {
        if (buffer.length === offset) break;
      }
    }
    return storage;
  };

  return readThrift();
};