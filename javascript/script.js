const apiKeyInput = document.getElementById('apiKeyInput');
const gameSelect = document.getElementById('gameSelect');
const questionInput = document.getElementById('questionInput');
const askButton = document.getElementById('askButton');
const aiResponse = document.getElementById('aiResponse')
const form = document.getElementById('form');

const displayError = (message) => {
    // Cria e exibe a mensagem de erro no HTML
    // A tag <use> do <svg> referencia um ícone de erro, definido no HTML como um sprite SVG.
    aiResponse.innerHTML = `
    <svg class="icon-error"><use xlink:href="#icon-error"></use></svg>
    <p>${message}</p>
    `;
    aiResponse.classList.add("error"); /* Adiciona classe de erro para estilização */
    aiResponse.classList.remove("hidden");  /* Exibe a resposta de erro em tela */
}

const markdownToHTML = (text) => {
    const converter = new showdown.Converter()
    return converter.makeHtml(text)
}

const askAI = async (question, game, apiKey) => {
    const model = "gemini-2.5-flash"
    const geminiURl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const pergunta = `
        ## Especialidade
        Você é um especialista assistente de meta e, ou informações para o jogo ${game}

        ## Tarefa
        Você deve respoder as perguntas do usuário com base no seu conheciento do jogo, estratégias, informações, builds e dicas

        ## Regras
        - Se você não sabe a resposta, responda com 'Não sei' e não tente inventar uma resposta.
        - Se a pergunta não está relacionada ao jogo, responda com 'Essa pergunta não está relacionada ao jogo'
        - Considere a data atual ${new Date().toLocaleDateString()}
        - Faça pesquisas atualizadas sobre o patch atual, baseado na data atual, para dar uma resposta coerente.
        - Nunca responda com informações que você não tem certeza de que contenham no patch/versão atual do jogo.

        ## Resposta
        Economize na resposta, seja direto e responda no máximo 500 caracteres. 
        - Responda em markdown
        - Não precisa fazer nenhuma saudação ou despedida, apenas responda o que o usuário está fazendo

        ## Exemplo de resposta
        pergunta do usuário: Melor build rengar jungle
        resposta: a build mais atual é: /n/n **Itens:**/n/n coloque os itens aqui./n/n**Runas:/n/nexemplo de runas/n/n

        ---

        Aqui está a pergunta do usuário ${question}
    `

    const contents = [{
        role: "user",
        parts: [{
            text: pergunta
        }]
    }]

    const tools = [{
        google_search: {}
    }]

    // chamada API
    const response = await fetch(geminiURl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents,
            tools
        })
    })
    
    // Verifica se a requisição foi bem-sucedida
    if (!response.ok) {
        // Tenta extrair a mensagem de erro do corpo da resposta
        // Se ocorrer um erro ao transformar a resposta em JSON (response.json()), então usamos um catch para retornar um objeto de erro padrão, garantindo que a resposta sempre seja um objeto JSON
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        // Após, lança um erro com a mensagem de erro retornada pela API (errorData.error.message) ou transforma o objeto de erro em uma string JSON e o insere na mensagem
        // O trecho abaixo faz com que a execução da função atual seja interrompida e o erro seja tratado no bloco catch do código que chamou essa função.
        throw new Error("Ocorreu um erro ao processar sua pergunta. Verifique sua API Key ou tente novamente.",
            { cause: `Erro da API: ${response.status} - ${errorData.error?.message || JSON.stringify(errorData)}` }
        );
    }

    // Verifica a resposta fornecida pela API
    const data = await response.json();
    // O operador "?." é utilizada para verificar se a propriedade existe antes de tentar acessá-la, evitando erros caso a estrutura do objeto seja diferente do esperado.
    // Com esse operador, se alguma propriedade não existir, o resultado será "undefined" ao invés de lançar um erro.
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    // Abaixo, valida se a resposta está vazia ou não foi encontrada (undefined), após lança um erro com uma mensagem personalizada
    if (!responseText) {
        // A mensagem do primeiro parâmetro utilizei para ser mostrada ao usuário, enquanto a do segundo parâmetro posteriormente será adicionada ao Console, para o desenvolvedor entender o que aconteceu. Apenas um exemplo de uso.
        throw new Error("Não foi possível obter uma resposta da IA. A resposta pode estar vazia ou em um formato inesperado.",
            { cause: "O texto de resposta da IA está vazio ou o caminho até ele, no objeto de retorno da API, está diferente do padrão esperado." }
        );
    }
    return responseText;
}

const sendForm = async (event) => {
    event.preventDefault()
    const apiKey = 'AIzaSyBEOPguNHKKrSZ30wYodGWR-p_7bNQQIGU'
    const game = gameSelect.value
    const question = questionInput.value

    if (apiKey == '' || game == '' || question == '') {
        alert('Por favor, preencha todos os campos')
        return
    }

    askButton.disabled = true;
    askButton.textContent = 'Perguntando...'
    askButton.classList.add('loading')

    try {
        const text = await askAI(question, game, apiKey)
        aiResponse.innerHTML = markdownToHTML(text);
        aiResponse.classList.remove('hidden')
    } catch (error) {
        // Exibe a mensagem de erro no console
        console.error(error);
        // Exibe a mensagem de erro na interface
        displayError(error.message);
    } finally {
        askButton.disabled = false;
        askButton.textContent = "Perguntar"
        askButton.classList.remove('loading')
    }
}
form.addEventListener('submit', sendForm)