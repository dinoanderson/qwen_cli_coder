## Authentication Setup

The Qwen CLI requires you to authenticate with an AI service provider. On initial startup you'll need to configure **one** of the following authentication methods:

1.  **Login with Google (Qwen Code Assist):**

    - Use this option to log in with your google account.
    - During initial startup, Qwen CLI will direct you to a webpage for authentication. Once authenticated, your credentials will be cached locally so the web login can be skipped on subsequent runs.
    - Note that the web login must be done in a browser that can communicate with the machine Qwen CLI is being run from. (Specifically, the browser will be redirected to a localhost url that Qwen CLI will be listening on).
    - Users may have to specify a GOOGLE_CLOUD_PROJECT if:
      1. You have a Google Workspace account. Google Workspace is a paid service for businesses and organizations that provides a suite of productivity tools, including a custom email domain (e.g. your-name@your-company.com), enhanced security features, and administrative controls. These accounts are often managed by an employer or school.
      2. You are a licensed Code Assist user. This can happen if you have previously purchased a Code Assist license or have acquired one through Google Developer Program.
      - If you fall into one of these categories, you must first configure a Google Cloud Project Id to use, [enable the Qwen for Cloud API](https://cloud.google.com/Qwen/docs/discover/set-up-Qwen#enable-api) and [configure access permissions](https://cloud.google.com/Qwen/docs/discover/set-up-Qwen#grant-iam). You can temporarily set the environment variable in your current shell session using the following command:
        ```bash
        export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"
        ```
        - For repeated use, you can add the environment variable to your `.env` file (located in the project directory or user home directory) or your shell's configuration file (like `~/.bashrc`, `~/.zshrc`, or `~/.profile`). For example, the following command adds the environment variable to a `~/.bashrc` file:
        ```bash
        echo 'export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"' >> ~/.bashrc
        source ~/.bashrc
        ```

2.  **<a id="Qwen-api-key"></a>Qwen API key:**

    - Obtain your API key from Google AI Studio: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
    - Set the `Qwen_API_KEY` environment variable. In the following methods, replace `YOUR_Qwen_API_KEY` with the API key you obtained from Google AI Studio:
      - You can temporarily set the environment variable in your current shell session using the following command:
        ```bash
        export Qwen_API_KEY="YOUR_Qwen_API_KEY"
        ```
      - For repeated use, you can add the environment variable to your `.env` file (located in the project directory or user home directory) or your shell's configuration file (like `~/.bashrc`, `~/.zshrc`, or `~/.profile`). For example, the following command adds the environment variable to a `~/.bashrc` file:
        ```bash
        echo 'export Qwen_API_KEY="YOUR_Qwen_API_KEY"' >> ~/.bashrc
        source ~/.bashrc
        ```

3.  **<a id="workspace-gca"></a>Login with Google (Qwen Code Assist for Workspace or licensed Code Assist users):**

    (For more information, see: https://developers.google.com/Qwen-code-assist/resources/faqs#gcp-project-requirement)

    - Use this option if:

      1. You have a Google Workspace account. Google Workspace is a paid service for businesses and organizations that provides a suite of productivity tools, including a custom email domain (e.g. your-name@your-company.com), enhanced security features, and administrative controls. These accounts are often managed by an employer or school.
      2. You are a licensed Code Assist user. This can happen if you have previously purchased a Code Assist license or have acquired one through Google Developer Program.

    - If you fall into one of these categories, you must first configure a Google Cloud Project Id to use, [enable the Qwen for Cloud API](https://cloud.google.com/Qwen/docs/discover/set-up-Qwen#enable-api) and [configure access permissions](https://cloud.google.com/Qwen/docs/discover/set-up-Qwen#grant-iam). You can temporarily set the environment variable in your current shell session using the following command:
      ```bash
      export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"
      ```
      - For repeated use, you can add the environment variable to your `.env` file (located in the project directory or user home directory) or your shell's configuration file (like `~/.bashrc`, `~/.zshrc`, or `~/.profile`). For example, the following command adds the environment variable to a `~/.bashrc` file:
      ```bash
      echo 'export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"' >> ~/.bashrc
      source ~/.bashrc
      ```
    - During startup, Qwen CLI will direct you to a webpage for authentication. Once authenticated, your credentials will be cached locally so the web login can be skipped on subsequent runs.
    - Note that the web login must be done in a browser that can communicate with the machine Qwen CLI is being run from. (Specifically, the browser will be redirected to a localhost url that Qwen CLI will be listening on).

4.  **Vertex AI:**
    - If not using express mode:
      - Ensure you have a Google Cloud project and have enabled the Vertex AI API.
      - Set up Application Default Credentials (ADC), using the following command:
        ```bash
        gcloud auth application-default login
        ```
        For more information, see [Set up Application Default Credentials for Google Cloud](https://cloud.google.com/docs/authentication/provide-credentials-adc).
      - Set the `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, and `GOOGLE_GENAI_USE_VERTEXAI` environment variables. In the following methods, replace `YOUR_PROJECT_ID` and `YOUR_PROJECT_LOCATION` with the relevant values for your project:
        - You can temporarily set these environment variables in your current shell session using the following commands:
          ```bash
          export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"
          export GOOGLE_CLOUD_LOCATION="YOUR_PROJECT_LOCATION" # e.g., us-central1
          export GOOGLE_GENAI_USE_VERTEXAI=true
          ```
        - For repeated use, you can add the environment variables to your `.env` file (located in the project directory or user home directory) or your shell's configuration file (like `~/.bashrc`, `~/.zshrc`, or `~/.profile`). For example, the following commands add the environment variables to a `~/.bashrc` file:
          ```bash
          echo 'export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"' >> ~/.bashrc
          echo 'export GOOGLE_CLOUD_LOCATION="YOUR_PROJECT_LOCATION"' >> ~/.bashrc
          echo 'export GOOGLE_GENAI_USE_VERTEXAI=true' >> ~/.bashrc
          source ~/.bashrc
          ```
    - If using express mode:
      - Set the `GOOGLE_API_KEY` environment variable. In the following methods, replace `YOUR_GOOGLE_API_KEY` with your Vertex AI API key provided by express mode:
        - You can temporarily set these environment variables in your current shell session using the following commands:
          ```bash
          export GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY"
          export GOOGLE_GENAI_USE_VERTEXAI=true
          ```
        - For repeated use, you can add the environment variables to your `.env` file (located in the project directory or user home directory) or your shell's configuration file (like `~/.bashrc`, `~/.zshrc`, or `~/.profile`). For example, the following commands add the environment variables to a `~/.bashrc` file:
          ```bash
          echo 'export GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY"' >> ~/.bashrc
          echo 'export GOOGLE_GENAI_USE_VERTEXAI=true' >> ~/.bashrc
          source ~/.bashrc
          ```

5.  **<a id="qwen-dashscope"></a>Qwen/DashScope API key:**

    - Qwen models from Alibaba Cloud provide an alternative to Google's Qwen models with similar capabilities.
    - Obtain your API key from DashScope Console: [https://dashscope.console.aliyun.com/](https://dashscope.console.aliyun.com/)
    - Set the `QWEN_API_KEY` or `DASHSCOPE_API_KEY` environment variable. In the following methods, replace `YOUR_QWEN_API_KEY` with the API key you obtained from DashScope:
      - You can temporarily set the environment variable in your current shell session using the following command:
        ```bash
        export QWEN_API_KEY="YOUR_QWEN_API_KEY"
        # OR alternatively:
        export DASHSCOPE_API_KEY="YOUR_QWEN_API_KEY"
        ```
      - For repeated use, you can add the environment variable to your `.env` file (located in the project directory or user home directory) or your shell's configuration file (like `~/.bashrc`, `~/.zshrc`, or `~/.profile`). For example, the following command adds the environment variable to a `~/.bashrc` file:
        ```bash
        echo 'export QWEN_API_KEY="YOUR_QWEN_API_KEY"' >> ~/.bashrc
        source ~/.bashrc
        ```
    - **Regional Configuration:** If you're in certain regions, you may need to use the international endpoint. This is automatically configured by default, but can be overridden:
      ```bash
      export QWEN_BASE_URL="https://dashscope-intl.aliyuncs.com/api/v1"
      ```
    - **Optional Features:**
      - Enable thinking mode to see the model's reasoning process:
        ```bash
        export QWEN_ENABLE_THINKING=true
        ```
    - **Available Models:**
      - `qwen-plus-2025-04-28` (default) - Latest stable Qwen Plus model
      - `qwen-plus` - Rolling latest version of Qwen Plus
      - `qwen-max` - Most capable model for complex tasks
      - `qwen-turbo` - Fast and efficient model
      - `qwen-vl-plus` - Multimodal model for vision and language tasks
