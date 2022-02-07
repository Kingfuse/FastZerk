const fs = require('fs'),
    path = require('path');

module.exports = function BerserkerJS(mod) {
    const { command } = mod;
    const { player } = mod.require.library;

    let skill_ids = {};
    let isEnabled = true;
    let lastTimeout = null;
    let config_file = require('./config.json');
	
    if (config_file['THUNDER_STRIKE_CANCEL_DELAY'] && typeof config_file['THUNDER_STRIKE_CANCEL_DELAY'] === "number") {
        skill_ids['3'] = {
            'delay': config_file['THUNDER_STRIKE_CANCEL_DELAY'],
        };
    }
    if (config_file['CYCLONE_CANCEL_DELAY'] && typeof config_file['CYCLONE_CANCEL_DELAY'] === "number") {
        skill_ids['10'] = {
            'delay': config_file['CYCLONE_CANCEL_DELAY'],
        };
    }
    if (config_file['VAMPIRIC_BLOW_CANCEL_DELAY'] && typeof config_file['VAMPIRIC_BLOW_CANCEL_DELAY'] === "number") {
        skill_ids['15'] = {
            'delay': config_file['VAMPIRIC_BLOW_CANCEL_DELAY'],
        };
    }
	if (config_file['RAMPAGE_CANCEL_DELAY'] && typeof config_file['RAMPAGE_CANCEL_DELAY'] === "number") {
        skill_ids['34'] = {
            'delay': config_file['RAMPAGE_CANCEL_DELAY'],
        };
    }
	if (config_file['RAMPAGE1_CANCEL_DELAY'] && typeof config_file['RAMPAGE1_CANCEL_DELAY'] === "number") {
        skill_ids['35'] = {
            'delay': config_file['RAMPAGE1_CANCEL_DELAY'],
        };
    }
	
    command.add('fastzerk', {
        '$default'() {
            isEnabled = !isEnabled;
            command.message(' Berserker script is now ' + (isEnabled ? 'enabled' : 'disabled') + '.');
        }
    });

    mod.hook('S_ACTION_STAGE', 9, { order: -10000000, filter: {fake: true} }, event => {
	 //mod.hook('S_ACTION_STAGE', 9, event => {

        if (!isEnabled || event.gameId !== mod.game.me.gameId || mod.game.me.class !== 'berserker') return;

        const skill_id = Math.floor(event.skill.id / 10000);
        const altSkill_id = event.skill.id % 100;

        if (skill_id in skill_ids || skill_id + '-' + altSkill_id in skill_ids) {

            const skillInfo = skill_id in skill_ids ? skill_ids[skill_id] : skill_ids[skill_id + '-' + altSkill_id];

            lastTimeout = mod.setTimeout(() => {
                mod.toClient('S_ACTION_END', 5, {
                    gameId: event.gameId,
                    loc: {
                        x: event.loc.x,
                        y: event.loc.y,
                        z: event.loc.z
                    },
                    w: event.w,
                    templateId: event.templateId,
                    skill: event.skill.id,
                    type: 12394123,
                    id: event.id
                });

            }, skillInfo['fixedDelay'] ? skillInfo['delay'] : skillInfo['delay'] / player['aspd']);
        }
    });
    
    mod.hook('S_ACTION_END', 5, {'order': -10000000,'filter': {'fake': true }}, event => {
        if (!isEnabled || event.gameId !== mod.game.me.gameId || mod.game.me.class !== 'berserker') return;

        const skill_id = Math.floor(event.skill.id / 10000);
        const altSkill_id = event.skill.id % 100;

        if (lastTimeout && (skill_id in skill_ids || skill_id + '-' + altSkill_id in skill_ids)) {
            lastTimeout = null;
            if (event.type == 12394123) {
                event.type = 4;
                return true;
            } else {
                return false;
            }
        }
    });

    mod.hook('C_CANCEL_SKILL', 3, event => {
        if (!isEnabled || mod.game.me.class !== 'berserker') return;

        if (lastTimeout) {
            mod.clearTimeout(lastTimeout);
            lastTimeout = null;
        }
    });

    mod.hook('S_EACH_SKILL_RESULT', 15, { 'order': -10000000 }, event => {
        if (!isEnabled || !lastTimeout || event.target !== mod.game.me.gameId || !event.reaction.enable) return;
        mod.clearTimeout(lastTimeout);
        lastTimeout = null;        
    });
}
