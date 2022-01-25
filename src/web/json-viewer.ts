import JSONFormatter from 'json-formatter-js';

export default function view(scope: any): any {
	const formatter = new JSONFormatter(scope);

	return formatter.render();
};