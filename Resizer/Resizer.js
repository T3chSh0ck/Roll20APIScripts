/*
 * Version 0.0.2
 * Made By Robin Kuiper
 * Skype: RobinKuiper.eu
 * Discord: Atheos#1014
 * Roll20: https://app.roll20.net/users/1226016/robin-k
 * Github: https://github.com/RobinKuiper/Roll20APIScripts
 * Reddit: https://www.reddit.com/user/robinkuiper/
*/

var Resizer = Resizer || (function() {
    'use strict';

    let unit_type, type, width, height, old_width, old_height, token_id, obj, chat_text;

    // Styling for the chat responses.
    const styles = {
        reset: 'padding: 0; margin: 0;',
        menu:  'background-color: #fff; border: 1px solid #000; padding: 5px; border-radius: 5px;',
        button: 'background-color: #000; border: 1px solid #292929; border-radius: 3px; padding: 5px; color: #fff; text-align: center;',
        list: 'list-style: none;',
        float: {
            right: 'float: right;',
            left: 'float: left;'
        },
        overflow: 'overflow: hidden;',
        fullWidth: 'width: 100%;',
        underline: 'text-decoration: underline;',
        strikethrough: 'text-decoration: strikethrough'
    },
    script_name = 'Resizer',
    state_name = 'RESIZER',

    handleInput = (msg) => {
        if (msg.type != 'api') return;

        // Split the message into command and argument(s)
        let args = msg.content.split(' ');
        let command = args.shift().substring(1);
        let extracommand = args.shift();

        if (command == state[state_name].config.command) {
            switch(extracommand){
                case 'help':
                    sendHelpMenu();
                break;

                case 'menu':
                    sendMenu();
                break;

                case 'reset':
                    state[state_name] = {};
                    setDefaults(true);
                    sendConfigMenu();
                break;

                case 'config':
                    if(args.length > 0){
                        let setting = args.shift().split('|');
                        let key = setting.shift();
                        let value = (setting[0] === 'true') ? true : (setting[0] === 'false') ? false : setting[0];

                        state[state_name].config[key] = value;
                    }

                    sendConfigMenu();
                break;

                // !resizer page
                // !resizer page 50 50
                case 'page':
                    width = args.shift();
                    height = args.shift();
                    unit_type = args.shift();

                    if(obj = getObj('page', getObj('player', msg.playerid).get('lastpage'))){
                        if(width && height){
                            let undoButton = makeButton('Undo', '!'+state[state_name].config.command + ' undo', styles.button);

                            old_width = obj.get('width')*1;
                            old_height = obj.get('height')*1;

                            if(unit_type === 'pixels'){
                                width = width/70;
                                height = height/70;
                            }

                            resize(obj, width, height);

                            chat_text = 'The page is resized to <b>' + width + 'un.</b> by <b>' + height + 'un.</b>.<br><br>'+undoButton;
                        }else{
                            chat_text = 'The size of this page is <b>' + obj.get('width') + 'un.</b> by <b>' + obj.get('height') + 'un.</b>';
                        }
                    }else{
                        chat_text = 'Something went wrong, try again, or contact the developer.';
                    }
                    

                    sendMenu(chat_text);
                break;

                // !resizer undo
                case 'undo':
                    if(obj.length > 1){
                        obj.forEach((o, i) => {
                            pre_log(o)
                            resize(o, old_width[i], old_height[i]);
                        });
                    }else{
                        resize(obj, old_width, old_height);
                    }

                    sendMenu('I have undone your wrongings!');
                break;

                // !resizer
                // !resizer (with selected graphics)
                // !resizer 50 50
                default:
                    width = extracommand;
                    height = args.shift();

                    if(msg.selected && width && height){
                        let undoButton = makeButton('Undo', '!'+state[state_name].config.command + ' undo', styles.button);
                        if(msg.selected.length > 1){
                            old_width = []; old_height = []; obj = []

                            msg.selected.forEach((token, i) => {
                                obj.push(getObj(token._type, token._id));

                                old_width.push(obj[i].get('width'));
                                old_height.push(obj[i].get('height'));

                                resize(obj[i], width, height);
                            })

                            chat_text = 'The graphics are resized to <b>' + width + 'px</b> by <b>' + height + 'px</b>.<br><br>'+undoButton;
                        }else{
                            obj = getObj(msg.selected[0]._type, msg.selected[0]._id)

                            old_width = obj.get('width');
                            old_height = obj.get('height');

                            resize(obj, width, height);

                            chat_text = 'The graphic is resized to <b>' + width + 'px</b> by <b>' + height + 'px</b>.<br><br>'+undoButton;
                        }                        
                    }else if(msg.selected){
                        chat_text = '<b>Sizes</b><br>';
                        msg.selected.forEach(token => {
                            token = getObj(token._type, token._id);
                            chat_text += '<b>'+token.get('name') + ':</b> ' + token.get('width') + 'px by ' + token.get('height') + 'px.<br>';
                            pre_log(token)
                        });
                    }

                    sendMenu(chat_text);
                break;
            }
        }
    },

    resize = (obj, width, height) => {
        obj.set({ width: width*1, height: height*1 });
    },

    sendConfigMenu = (first) => {
        let commandButton = makeButton('!'+state[state_name].config.command, '!' + state[state_name].config.command + ' config command|?{Command (without !)}', styles.button + styles.float.right)

        let listItems = [
            '<span style="'+styles.float.left+'">Command:</span> ' + commandButton,
        ];

        let resetButton = makeButton('Reset', '!' + state[state_name].config.command + ' reset', styles.button + styles.fullWidth);

        let title_text = (first) ? script_name + ' First Time Setup' : script_name + ' Config';
        let contents = makeList(listItems, styles.reset + styles.list + styles.overflow, styles.overflow)+'<hr><p style="font-size: 80%">You can always come back to this config by typing `!'+state[state_name].config.command+' config`.</p><hr>'+resetButton;
        makeAndSendMenu(contents, title_text, 'gm');
    },

    sendHelpMenu = (first) => {
        let configButton = makeButton('Config', '!' + state[state_name].config.command + ' config', styles.button + styles.fullWidth)

        let listItems = [
            '<span style="'+styles.underline+'">!'+state[state_name].config.command+'</span> - Shows the resizer menu and size of selected graphics.',
            '<span style="'+styles.underline+'">!'+state[state_name].config.command+' help</span> - Shows this menu.',
            '<span style="'+styles.underline+'">!'+state[state_name].config.command+' config</span> - Shows the configuration menu.',
            '<span style="'+styles.underline+'">!'+state[state_name].config.command+' [width] [height]</span> - Resizes the selected graphic(s).',
            '<span style="'+styles.underline+'">!'+state[state_name].config.command+' page</span> - Shows the page size.',
            '<span style="'+styles.underline+'">!'+state[state_name].config.command+' page [width] [height] ?pixels</span> - Resizes the page (add pixels to the end if you want to use pixels instead of units.).',
        ]

        let contents = '<b>Commands:</b>'+makeList(listItems, styles.reset + styles.list, 'margin-bottom: 5px;')+'<hr>'+configButton;
        makeAndSendMenu(contents, script_name + ' Help', 'gm')
    },

    sendMenu = (message) => {
        let getGraphicSizeButton = makeButton('Get Selected Graphic Size', '!' + state[state_name].config.command, styles.button + styles.fullWidth);
        let getPageSizeButton = makeButton('Get Page Size', '!' + state[state_name].config.command + ' page', styles.button + styles.fullWidth);
        let resizeGraphicButton = makeButton('Resize Selected Graphic', '!' + state[state_name].config.command + ' ?{Width} ?{Height}', styles.button + styles.fullWidth);
        let resizePageButton = makeButton('Resize Page', '!' + state[state_name].config.command + ' page ?{Width} ?{Height} ?{Units or Pixels?|Pixels,pixels|Units,units}', styles.button + styles.fullWidth);

        message = (message) ? '<hr><p>'+message+'</p>' : '';

        let buttons = getGraphicSizeButton+resizeGraphicButton+'<hr>'+getPageSizeButton+resizePageButton;

        makeAndSendMenu(buttons+message, script_name + ' Menu', 'gm');
    },

    makeAndSendMenu = (contents, title, whisper) => {
        title = (title && title != '') && makeTitle(title)
        whisper = (whisper && whisper !== '') && '/w ' + whisper + ' ';
        sendChat(script_name, whisper + '<div style="'+styles.menu+styles.overflow+'">'+title+contents+'</div>');
    },

    makeTitle = (title) => {
        return '<h3 style="margin-bottom: 10px;">'+title+'</h3>';
    },

    makeButton = (title, href, style) => {
        return '<a style="'+style+'" href="'+href+'">'+title+'</a>';
    },

    makeList = (items, listStyle, itemStyle) => {
        let list = '<ul style="'+listStyle+'">';
        items.forEach((item) => {
            list += '<li style="'+itemStyle+'">'+item+'</li>';
        });
        list += '</ul>';
        return list;
    },

    pre_log = (message) => {
        log('---------------------------------------------------------------------------------------------');
        if(message === 'line'){ return; }
        log(message);
        log('---------------------------------------------------------------------------------------------');
    },

    checkInstall = () => {
        if(!_.has(state, state_name)){
            state[state_name] = state[state_name] || {};
        }
        setDefaults();

        log(script_name + ' Ready! Command: !'+state[state_name].config.command);
        if(state[state_name].config.debug){ makeAndSendMenu(script_name + ' Ready! Debug On.', '', 'gm') }
    },

    registerEventHandlers = () => {
        on('chat:message', handleInput);
    },

    setDefaults = (reset) => {
        const defaults = {
            config: {
                command: 'resizer'
            }
        };

        if(!state[state_name].config){
            state[state_name].config = defaults.config;
        }else{
            if(!state[state_name].config.hasOwnProperty('command')){
                state[state_name].config.command = defaults.config.command;
            }
        }

        if(!state[state_name].config.hasOwnProperty('firsttime') && !reset){
            sendConfigMenu(true);
            state[state_name].config.firsttime = false;
        }
    };

    return {
        CheckInstall: checkInstall,
        RegisterEventHandlers: registerEventHandlers
    };
})();

on('ready',function() {
    'use strict';

    Resizer.CheckInstall();
    Resizer.RegisterEventHandlers();
});