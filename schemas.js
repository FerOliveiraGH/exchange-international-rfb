import SimpleSchema from 'simpl-schema';
import moment from 'moment';
import { cpf, cnpj } from 'cpf-cnpj-validator';

function ensureAllowedCharacters(val) {
    return String((this ? this.value : val) || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]|/g, '').replace(/\'/g, '').replace(/\|/g, '');
}

const commonSchemas = {
    id: {
        type: String,
        max: 1024,
        autoValue: ensureAllowedCharacters,
        required: false,
    },
    name: {
        type: String,
        min: 1,
        max: 80,
        autoValue: ensureAllowedCharacters,
    },
    origin_wallet: {
        type: String,
        min: 1,
        max: 256,
        autoValue: ensureAllowedCharacters,
    },
    address: {
        type: String,
        max: 120,
        autoValue: ensureAllowedCharacters,
        required: false,
    },
    country: {
        type: String,
        max: 2,
        autoValue: ensureAllowedCharacters,
        required: false,
    },
    identity_type: {
        type: String,
        allowedValues: ['CPF', 'CNPJ', 'NIF_PF', 'NIF_PJ', 'PASSPORT', 'COUNTRY_NO_ID', 'USER_NO_ID'],
    },
    url: {
        type: String,
        min: 1,
        max: 80,
        autoValue: ensureAllowedCharacters,
        regEx: SimpleSchema.RegEx.Url,
    },
    date: {
        type: String,
        autoValue: function() {
            let m = this.value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
            ? this.value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
            : this.value.match(/^(\d{1,2})(\d{1,2})(\d{4})$/);

            return (m) ? moment(new Date(m[3], m[2]-1, m[1])).toISOString()
            : moment(new Date(this.value * 1000)).format('DDMMYYYY') !== 'Invalid date'
            ? moment(new Date(this.value * 1000)).toISOString()
            : moment(new Date(this.value)).format('DDMMYYYY') !== 'Invalid date'
            ? moment(new Date(this.value)).toISOString()
            : null;
        }
    },
    brl: {
        type: Number,
        autoValue: function() {
            if(typeof this.value === 'string'){
                return Number(this.value.replace(/\,/g, '.').match(/[0-9.]/g).join(''));
            }
        },
        custom: function() {
            return this.value.toFixed(2).length-1 <= 16 ? this.value >= 0 ? undefined : 'Value cannot be zero or less than zero' : 'Value exceeds the maximum allowed digits.'
        }
    },
    brl_fees: {
        type: Number,
        autoValue: function() {
            if(typeof this.value === 'string'){
                return Number(this.value.replace(/\,/g, '.').match(/[0-9.]/g).join(''));
            } else if (!this.value) {
                return 0;
            }
        },
        custom: function() {
            return this.value.toFixed(2).length-1 <= 16 ? undefined : 'Value exceeds the maximum allowed digits.'
        },
        required: false,
    },
    coin: {
        type: Number,
        autoValue: function() {
            if(typeof this.value === 'string'){
                return Number(this.value.replace(/\,/g, '.').match(/[0-9.]/g).join(''));
            }
        },
        custom: function() {
            if (!this.value) return;
            return this.value.toFixed(10).length-1 <= 30 ? this.value >= 0 ? undefined : 'Value cannot be zero or less than zero' : 'Value exceeds the maximum allowed digits.';
        }
    },
    coin_symbol: {
        type: String,
        min: 1,
        max: 10,
        autoValue: ensureAllowedCharacters,
    },
    document: {
        type: String,
        max: 30,
        autoValue: function () {
            if(this.value){
                if(this.siblingField(this.key.split("_")[0] + '_identity_type').value === 'CPF'
                || this.siblingField(this.key.split("_")[0] + '_identity_type').value === 'CNPJ'){
                    return ensureAllowedCharacters((this.value).match(/\d+/g).join(''));
                }
            }
            return ensureAllowedCharacters(this.value);
        },
        custom: function() {
            if(this.value){
                if(this.siblingField(this.key.split("_")[0] + '_identity_type').value === 'CPF'){
                    return cpf.isValid(this.value) ? undefined : 'Invalid CPF';
                } else if(this.siblingField(this.key.split("_")[0] + '_identity_type').value === 'CNPJ'){
                    return cnpj.isValid(this.value) ? undefined : 'Invalid CNPJ';
                }
            }

        },
        required: false,
    }
};

export const exchangeDataSchema = new SimpleSchema({
    exchange_name: commonSchemas.name,
    exchange_country: commonSchemas.country,
    exchange_url: commonSchemas.url,
});

export const buySellOperationSchema = new SimpleSchema({
    date: commonSchemas.date,
    brl_value: commonSchemas.brl,
    brl_fees: commonSchemas.brl_fees,
    coin_symbol: commonSchemas.coin_symbol,
    coin_quantity: commonSchemas.coin
});

export const permutationOperationSchema = new SimpleSchema({
    date: commonSchemas.date,
    brl_fees: commonSchemas.brl_fees,

    received_coin_symbol: commonSchemas.coin_symbol,
    received_coin_quantity: commonSchemas.coin,

    delivered_coin_symbol: commonSchemas.coin_symbol,
    delivered_coin_quantity: commonSchemas.coin
});

export const depositOperationSchema = new SimpleSchema({
    date: commonSchemas.date,
    brl_fees: commonSchemas.brl_fees,

    coin_symbol: commonSchemas.coin_symbol,
    coin_quantity: commonSchemas.coin,

    origin_wallet: commonSchemas.origin_wallet
});

export const withdrawOperationSchema = new SimpleSchema({
    date: commonSchemas.date,
    brl_fees: commonSchemas.brl_fees,

    coin_symbol: commonSchemas.coin_symbol,
    coin_quantity: commonSchemas.coin,
});

export const paymentOperationSchema = new SimpleSchema({
    date: commonSchemas.date,
    brl_fees: commonSchemas.brl_fees,

    coin_symbol: commonSchemas.coin_symbol,
    coin_quantity: commonSchemas.coin,
});