(function($) {
    "use strict";

    var TieJS = function(form, options) {
        var self = $(this);
        var $form = $(form);
        var fieldNames = [];

        // settings
        var settings = $.extend({
            formName: null,
            bindingSource: {},
            onSubmit: function() {
            }
        }, options);

        if (settings.formName) {
            $form.attr('name', settings.formName);
        }

        $form.on('submit', function(e) {
            e.preventDefault();

            if (_validate($form, fieldNames)) {
                settings.onSubmit();
            }
        });

        this.addFields = function(fields) {
            $.each(fields, function(index, field) {
                if (field.data) {
                    $form.append(_addField(field.type, field.data));
                    if (_findInArray(field.data.name, fieldNames) === null) {
                        fieldNames.push({name: field.data.name, binding: ""});
                    }
                }
            });

            return this;
        };

        this.addColumns = function(columns) {
            if (columns.length > 0) {
                $form.append(_addColumns(columns, fieldNames));
            }

            return this;
        };

        this.addBindings = function(bindings) {
            if (settings.bindingSource) {
                $.each(bindings, function(index, binding) {
                    $.each(binding, function(fieldName, property) {
                        _bind($form, settings.bindingSource, fieldName, property);

                        var fieldNameData = _findInArray(fieldName, fieldNames);
                        fieldNameData.binding = property;
                    });
                });
            }

            return this;
        };

        this.reload = function() {
            $.each(fieldNames, function(index, fieldNameData) {
                var field = $form.find('input[name=' + fieldNameData.name + ']');
                if (field && typeof (settings.bindingSource[fieldNameData.binding]) !== 'undefined') {
                    _updateFieldData(field, settings.bindingSource, fieldNameData.binding);
                }
            });
        };

        var _addField = function(type, data) {
            var field = null;
            switch (type) {
                case 'text':
                case 'number':
                case 'time':
                case 'email':
                case 'password':
                    field = _defaultField(type, data);
                    break;
                case 'checkbox':
                    field = _checkboxField(data);
                    break;
                case 'radio':
                    field = _radioField(data);
                    break;
                case 'button':
                    field = _button(data);
                    break;
            }

            return field;
        };

        var _addColumns = function(columns, fieldNames) {
            var row = $("<div></div>");
            row.addClass("row");

            $.each(columns, function(index, field) {
                var column = $("<div></div>");
                column.addClass("col-md-6");

                if (field.data) {
                    column.append(_addField(field.type, field.data));
                    fieldNames.push(field.data.name);
                }

                row.append(column);
            });

            return row;
        };

        var _bind = function($obj, bindingSource, fieldName, property) {
            var field = $obj.find('input[name=' + fieldName + ']');

            if (field && typeof (bindingSource[property]) !== 'undefined') {
                var type = field.attr('type');
                field.on("change", function() {
                    switch (type) {
                        case 'checkbox':
                            var value = field.is(':checked') ? 1 : 0;
                            bindingSource[property] = value;
                            break;
                        case 'radio':
                            var value = $obj.find('input[name=' + fieldName + ']:checked').val();
                            bindingSource[property] = value;
                            break;
                        default:
                            bindingSource[property] = field.val();
                    }
                });

                _updateFieldData(field, bindingSource, property);
            }
        };

        var _validate = function($obj, fieldNames) {
            _clearMarker($obj);

            var isValid = true;
            $.each(fieldNames, function(index, fieldNameData) {
                var field = $obj.find('input[name=' + fieldNameData.name + ']');

                if (_hasAttribute(field, 'required')) {
                    if (!$(field).val()) {
                        isValid = false;
                        _addFieldError(field);
                    }
                }

                var value = $(field).val();
                var type = $(field).attr('type');
                switch (type) {
                    case 'number':
                        if (!$.isNumeric(value)) {
                            isValid = false;
                            _addFieldError(field);
                        }
                        break;

                    case 'email':
                        var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                        if (!regex.test(value)) {
                            isValid = false;
                            _addFieldError(field);
                        }
                        break;
                }
            });

            if (!isValid) {
                var error = $("<div></div>");
                error.addClass("alert alert-danger");
                error.text("Bitte beheben Sie die im Formular hervorgehobenen Fehler");

                $obj.prepend(error);
            }

            return isValid;
        };

        var _defaultField = function(type, data) {
            var formGroup = $("<div></div>");
            formGroup.addClass("form-group");

            formGroup.append("<label class='control-label'>" + data.label + ":</label>");
            var input = "<input type='" + type + "' name='" + data.name + "' class='form-control'";

            if (data.css) {
                input = input.slice(0, -1);
                input += " " + data.css + "'";
            }

            if (data.placeholder) {
                input += " placeholder='" + data.placeholder + "'";
            }

            if (data.attributes) {
                input += " " + data.attributes;
            }

            input += " />";
            formGroup.append(input);

            return formGroup;
        };

        var _checkboxField = function(data) {
            var checkboxDiv = $("<div></div>");
            checkboxDiv.addClass("checkbox");

            var label = $("<label></label>");
            label.addClass("control-label");

            var input = "<input type='checkbox' name='" + data.name + "'";

            if (data.css) {
                input = input.slice(0, -1);
                input += " " + data.css + "'";
            }

            if (data.attributes) {
                input += " " + data.attributes;
            }

            input += " />";

            label.append(input);
            label.append(data.label);

            checkboxDiv.append(label);

            return checkboxDiv;
        };

        var _radioField = function(data) {
            var radioDiv = $("<div></div>");
            radioDiv.addClass("radio");

            var label = $("<label></label>");
            label.addClass("control-label");

            var input = "<input type='radio' name='" + data.name + "' value='" + data.value + "'";

            if (data.css) {
                input = input.slice(0, -1);
                input += " " + data.css + "'";
            }

            if (data.attributes) {
                input += " " + data.attributes;
            }

            input += " />";

            label.append(input);
            label.append(data.label);

            radioDiv.append(label);

            return radioDiv;
        };

        var _button = function(data) {
            var button = "<button type='button' class='btn btn-default'";

            if (data.css) {
                button = button.slice(0, -1);
                button += " " + data.css + "'";
            }

            button += ">" + data.label + "</button>";
            return button;
        };

        function _clearMarker($obj) {
            $obj.find('div.alert').remove();
            $obj.find('.form-group').each(function(index, value) {
                $(value).removeClass('has-error has-feedback');
                $(value).find('.form-control-feedback').remove();
            });
        }

        function _hasAttribute(field, attribute) {
            var attr = $(field).attr(attribute);
            return typeof attr !== 'undefined' && attr !== false;
        }

        function _addFieldError(field) {
            var $formGroup = field.parent();
            $formGroup.addClass('has-error has-feedback');
            $formGroup.append("<span class='fa fa-times form-control-feedback'></span>");
        }

        function _updateFieldData(field, bindingSource, property) {
            var type = field.attr('type');
            switch (type) {
                case 'checkbox':
                    var state = bindingSource[property];
                    if (state == 0) {
                        field.prop('checked', false);
                    } else {
                        field.prop('checked', true);
                    }
                    break;

                case 'radio':
                    field.val([bindingSource[property]]);
                    break;

                default:
                    field.val(bindingSource[property]);
            }
        }

        function _findInArray(value, array) {
            for (var i = 0; i < array.length; i++) {
                var obj = array[i];
                if (obj.name === value) {
                    return obj;
                }
            }

            return null;
        }
    };

    $.fn.TieJS = function(options) {
        return this.each(function()
        {
            var element = $(this);

            if (element.data('tiejs')) {
                return;
            }

            var tiejs = new TieJS(this, options);
            element.data('tiejs', tiejs);
        });
    };
})(jQuery);