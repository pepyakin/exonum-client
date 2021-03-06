import {isInstanceofOfNewType} from './generic';
import {Uint32} from './primitive';

/**
 * Serialize data into array of 8-bit integers and insert into buffer
 * @param {Array} buffer
 * @param {number} shift - the index to start write into buffer
 * @param {Object} data
 * @param type - can be {NewType} or one of built-in types
 * @returns {Array}
 */
export function serialize(buffer, shift, data, type) {
    function isFixed(fields) {
        for (var fieldName in fields) {
            if (!fields.hasOwnProperty(fieldName)) {
                continue;
            }

            if (isInstanceofOfNewType(fields[fieldName].type)) {
                if (!isFixed(fields[fieldName].type.fields)) {
                    return false;
                }
            } else if (fields[fieldName].type === String) {
                return false;
            }
        }
        return true;
    }

    for (var i = 0; i < type.size; i++) {
        buffer[shift + i] = 0;
    }

    for (var fieldName in type.fields) {
        if (!type.fields.hasOwnProperty(fieldName)) {
            continue;
        }

        var fieldData = data[fieldName];

        if (fieldData === undefined) {
            throw new TypeError('Field ' + fieldName + ' is not defined.');
        }

        var fieldType = type.fields[fieldName];
        var from = shift + fieldType.from;

        if (isInstanceofOfNewType(fieldType.type)) {
            if (isFixed(fieldType.type.fields)) {
                buffer = serialize(buffer, from, fieldData, fieldType.type);
            } else {
                var end = buffer.length;
                Uint32(end, buffer, from, from + 4);
                buffer = serialize(buffer, end, fieldData, fieldType.type);
                Uint32(buffer.length - end, buffer, from + 4, from + 8);
            }
        } else {
            buffer = fieldType.type(fieldData, buffer, from, shift + fieldType.to);
        }
    }

    return buffer;
}
