'use strict';
'require view';
'require form';
'require fs';
'require ui';

const CTL = '/usr/libexec/usbip-ctl';
const ctl = (args) => fs.exec_direct(CTL, args, 'json')
	.catch((e) => ({ ok: false, error: e.message }));

function notify(r, okMsg) {
	if (r && r.ok) ui.addNotification(null, E('p', okMsg), 'info');
	else ui.addNotification(null, E('p', (r && r.error) || _('Unknown error')), 'danger');
}

return view.extend({
	load: function () { return ctl(['status']); },

	render: function (status) {
		const portsBox = E('div');
		const listBox = E('div');
		const hostInput = E('input', { 'class': 'cbi-input-text', type: 'text', placeholder: '192.168.1.10' });

		const renderPorts = (st) => {
			const rows = (st && st.ok && st.ports) || [];
			const body = rows.length ? rows.map((p) => E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, String(p.port)),
				E('td', { 'class': 'td' }, p.url || '-'),
				E('td', { 'class': 'td' }, p.desc || ''),
				E('td', { 'class': 'td' }, E('button', {
					'class': 'btn cbi-button cbi-button-remove',
					click: ui.createHandlerFn(this, () => ctl(['detach', String(p.port)])
						.then((r) => { notify(r, _('Detached')); return refresh(); }))
				}, _('Detach')))
			])) : [E('tr', { 'class': 'tr placeholder' }, E('td', { 'class': 'td', colspan: 4 }, _('No imported devices')))];
			portsBox.replaceChildren(E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, _('Port')), E('th', { 'class': 'th' }, _('Source')),
					E('th', { 'class': 'th' }, _('Device')), E('th', { 'class': 'th' }, '')])
			].concat(body)));
		};

		const refresh = () => ctl(['status']).then(renderPorts);

		const doList = () => {
			const host = hostInput.value.trim();
			listBox.replaceChildren(E('em', _('Querying…')));
			return ctl(['list', host]).then((r) => {
				if (!r.ok) { listBox.replaceChildren(E('div', { 'class': 'alert-message warning' }, r.error)); return; }
				const devs = r.devices || [];
				listBox.replaceChildren(devs.length ? E('table', { 'class': 'table' }, devs.map((d) => E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, d.busid), E('td', { 'class': 'td' }, d.desc),
					E('td', { 'class': 'td' }, E('button', {
						'class': 'btn cbi-button cbi-button-add',
						click: ui.createHandlerFn(this, () => ctl(['attach', host, d.busid])
							.then((rr) => { notify(rr, _('Attached')); return refresh(); }))
					}, _('Attach')))
				]))) : E('em', _('No exportable devices found')));
			});
		};

		const m = new form.Map('usbip', _('USB/IP client'),
			_('Import USB devices from a remote USB/IP server through the virtual host controller (vhci-hcd).'));
		const s = m.section(form.GridSection, 'device', _('Auto-attach at boot'));
		s.addremove = true; s.anonymous = true;
		let o = s.option(form.Flag, 'enabled', _('Enabled')); o.default = '1'; o.editable = true;
		o = s.option(form.Value, 'host', _('Server')); o.datatype = 'host'; o.rmempty = false;
		o = s.option(form.Value, 'busid', _('Bus ID')); o.placeholder = '1-1'; o.rmempty = false;
		o.validate = (sid, v) => /^[0-9]+-[0-9]+(\.[0-9]+)*$/.test(v) || _('Format like 1-1 or 1-1.2');

		renderPorts(status);
		return m.render().then((mapEl) => E([
			E('h2', _('USB/IP client')),
			E('div', { 'class': 'cbi-section' }, [E('h3', _('Imported devices')), portsBox,
				E('button', { 'class': 'btn cbi-button', click: ui.createHandlerFn(this, refresh) }, _('Refresh'))]),
			E('div', { 'class': 'cbi-section' }, [E('h3', _('Browse server')),
				E('div', {}, [hostInput, ' ', E('button', { 'class': 'btn cbi-button cbi-button-action',
					click: ui.createHandlerFn(this, doList) }, _('List devices'))]), listBox]),
			mapEl
		]));
	}
});
