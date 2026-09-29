import os
import shutil
import subprocess
import tempfile

# ============================================================
# Compiler paths
# ============================================================

GCC_PATH = r"C:\msys64\ucrt64\bin\gcc.exe"
GPP_PATH = r"C:\msys64\ucrt64\bin\g++.exe"

MSYS2_BIN = r"C:\msys64\ucrt64\bin"

# Java paths
JAVA_PATHS = [
    r"C:\Java\jdk1.8.0_481\bin",
    r"C:\Program Files\Java\jdk1.8.0_481\bin",
]

EXECUTION_TIMEOUT = 10


# ============================================================
# Helper Functions
# ============================================================

def get_msys_environment():
    """
    Creates an environment containing the MSYS2 UCRT64
    compiler directory in PATH.
    """

    env = os.environ.copy()

    current_path = env.get("PATH", "")

    if MSYS2_BIN not in current_path:
        env["PATH"] = MSYS2_BIN + os.pathsep + current_path

    return env


def combine_output(result):
    """
    Combines stdout and stderr.
    """

    output = result.stdout or ""
    error = result.stderr or ""

    if output and error:
        return output + "\n" + error

    if output:
        return output

    if error:
        return error

    return "Program executed successfully with no output."


# ============================================================
# Python
# ============================================================

def run_python(code: str):
    temp_dir = None

    try:
        temp_dir = tempfile.mkdtemp()

        python_file = os.path.join(
            temp_dir,
            "main.py"
        )

        with open(
            python_file,
            "w",
            encoding="utf-8"
        ) as file:
            file.write(code)

        result = subprocess.run(
            ["python", python_file],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=EXECUTION_TIMEOUT
        )

        if result.returncode != 0:

            return (
                "Runtime Error:\n\n"
                f"Return Code: {result.returncode}\n\n"
                f"STDOUT:\n{result.stdout}\n\n"
                f"STDERR:\n{result.stderr}"
            )

        return combine_output(result)

    except subprocess.TimeoutExpired:

        return "Execution stopped: Program took too long."

    except Exception as e:

        return (
            "Python execution error: "
            f"{type(e).__name__}: {str(e)}"
        )

    finally:

        if temp_dir and os.path.exists(temp_dir):

            shutil.rmtree(
                temp_dir,
                ignore_errors=True
            )


# ============================================================
# C
# ============================================================

def run_c(code: str):
    temp_dir = None

    try:

        temp_dir = tempfile.mkdtemp()

        c_file = os.path.join(
            temp_dir,
            "main.c"
        )

        exe_file = os.path.join(
            temp_dir,
            "main.exe"
        )

        # Write source code
        with open(
            c_file,
            "w",
            encoding="utf-8"
        ) as file:

            file.write(code)

        # Check GCC
        if not os.path.exists(GCC_PATH):

            return (
                "GCC compiler not found:\n"
                f"{GCC_PATH}"
            )

        # Prepare MSYS2 environment
        env = get_msys_environment()

        # Compile C program
        compile_result = subprocess.run(
            [
                GCC_PATH,
                c_file,
                "-o",
                exe_file
            ],
            cwd=MSYS2_BIN,
            env=env,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=EXECUTION_TIMEOUT
        )

        # Compilation failed
        if compile_result.returncode != 0:

            return (
                "Compilation Error:\n\n"
                f"Return Code: {compile_result.returncode}\n\n"
                f"STDOUT:\n{compile_result.stdout}\n\n"
                f"STDERR:\n{compile_result.stderr}"
            )

        # Check executable
        if not os.path.exists(exe_file):

            return (
                "Compilation Error:\n"
                "GCC completed but executable was not created."
            )

        # Run executable
        run_result = subprocess.run(
            [exe_file],
            cwd=temp_dir,
            env=env,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=EXECUTION_TIMEOUT
        )

        # Runtime error
        if run_result.returncode != 0:

            return (
                "Runtime Error:\n\n"
                f"Return Code: {run_result.returncode}\n\n"
                f"STDOUT:\n{run_result.stdout}\n\n"
                f"STDERR:\n{run_result.stderr}"
            )

        return combine_output(run_result)

    except subprocess.TimeoutExpired:

        return "Execution stopped: Program took too long."

    except Exception as e:

        return (
            "C execution error: "
            f"{type(e).__name__}: {str(e)}"
        )

    finally:

        if temp_dir and os.path.exists(temp_dir):

            shutil.rmtree(
                temp_dir,
                ignore_errors=True
            )


# ============================================================
# C++
# ============================================================

def run_cpp(code: str):
    temp_dir = None

    try:

        temp_dir = tempfile.mkdtemp()

        cpp_file = os.path.join(
            temp_dir,
            "main.cpp"
        )

        exe_file = os.path.join(
            temp_dir,
            "main.exe"
        )

        # Write source code
        with open(
            cpp_file,
            "w",
            encoding="utf-8"
        ) as file:

            file.write(code)

        # Check G++
        if not os.path.exists(GPP_PATH):

            return (
                "G++ compiler not found:\n"
                f"{GPP_PATH}"
            )

        # Prepare MSYS2 environment
        env = get_msys_environment()

        # Compile C++ program
        compile_result = subprocess.run(
            [
                GPP_PATH,
                cpp_file,
                "-o",
                exe_file
            ],
            cwd=MSYS2_BIN,
            env=env,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=EXECUTION_TIMEOUT
        )

        # Compilation failed
        if compile_result.returncode != 0:

            return (
                "Compilation Error:\n\n"
                f"Return Code: {compile_result.returncode}\n\n"
                f"STDOUT:\n{compile_result.stdout}\n\n"
                f"STDERR:\n{compile_result.stderr}"
            )

        # Check executable
        if not os.path.exists(exe_file):

            return (
                "Compilation Error:\n"
                "G++ completed but executable was not created."
            )

        # Run executable
        run_result = subprocess.run(
            [exe_file],
            cwd=temp_dir,
            env=env,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=EXECUTION_TIMEOUT
        )

        # Runtime error
        if run_result.returncode != 0:

            return (
                "Runtime Error:\n\n"
                f"Return Code: {run_result.returncode}\n\n"
                f"STDOUT:\n{run_result.stdout}\n\n"
                f"STDERR:\n{run_result.stderr}"
            )

        return combine_output(run_result)

    except subprocess.TimeoutExpired:

        return "Execution stopped: Program took too long."

    except Exception as e:

        return (
            "C++ execution error: "
            f"{type(e).__name__}: {str(e)}"
        )

    finally:

        if temp_dir and os.path.exists(temp_dir):

            shutil.rmtree(
                temp_dir,
                ignore_errors=True
            )


# ============================================================
# Java
# ============================================================

def find_java_executable(executable_name):
    """
    Always use the confirmed working JDK 1.8 installation.
    """

    java_dir = r"C:\java\jdk1.8.0_481\bin"

    executable_path = os.path.join(
        java_dir,
        executable_name
    )

    if os.path.exists(executable_path):
        return executable_path

    return None


def run_java(code: str):
    temp_dir = None

    try:

        temp_dir = tempfile.mkdtemp()

        # ====================================================
        # Find Java compiler
        # ====================================================

        javac_path = find_java_executable("javac.exe")

        if not javac_path:
            return (
                "Java compiler not found:\n"
                r"C:\java\jdk1.8.0_481\bin\javac.exe"
            )

        # ====================================================
        # Find Java runtime
        # ====================================================

        java_path = find_java_executable("java.exe")

        if not java_path:
            return (
                "Java runtime not found:\n"
                r"C:\java\jdk1.8.0_481\bin\java.exe"
            )

        # ====================================================
        # Remove Markdown code fences if AI returned them
        # ====================================================

        code = code.strip()

        if code.startswith("```"):

            lines = code.splitlines()

            # Remove first line such as ```java
            if lines:
                lines = lines[1:]

            # Remove final ```
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]

            code = "\n".join(lines).strip()

        # ====================================================
        # Detect public class name
        # ====================================================

        import re

        class_match = re.search(
            r'\bpublic\s+class\s+([A-Za-z_][A-Za-z0-9_]*)',
            code
        )

        if class_match:

            class_name = class_match.group(1)

        else:

            # If no public class exists, look for normal class
            class_match = re.search(
                r'\bclass\s+([A-Za-z_][A-Za-z0-9_]*)',
                code
            )

            if class_match:
                class_name = class_match.group(1)
            else:
                return (
                    "Java compilation error:\n"
                    "No Java class was found in the source code."
                )

        # ====================================================
        # Java file must match public class name
        # ====================================================

        java_file = os.path.join(
            temp_dir,
            f"{class_name}.java"
        )

        with open(
            java_file,
            "w",
            encoding="utf-8"
        ) as file:

            file.write(code)

        # ====================================================
        # Compile Java
        # ====================================================

        compile_result = subprocess.run(
            [
                javac_path,
                "-encoding",
                "UTF-8",
                java_file
            ],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=EXECUTION_TIMEOUT
        )

        # ====================================================
        # Compilation error
        # ====================================================

        if compile_result.returncode != 0:

            return (
                "Compilation Error:\n\n"
                f"Return Code: {compile_result.returncode}\n\n"
                f"STDOUT:\n{compile_result.stdout}\n\n"
                f"STDERR:\n{compile_result.stderr}"
            )

        # ====================================================
        # Check class file
        # ====================================================

        class_file = os.path.join(
            temp_dir,
            f"{class_name}.class"
        )

        if not os.path.exists(class_file):

            return (
                "Compilation Error:\n"
                f"javac completed but {class_name}.class "
                "was not created."
            )

        # ====================================================
        # Run Java program
        # ====================================================

        run_result = subprocess.run(
            [
                java_path,
                "-cp",
                temp_dir,
                class_name
            ],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=EXECUTION_TIMEOUT
        )

        # ====================================================
        # Runtime error
        # ====================================================

        if run_result.returncode != 0:

            return (
                "Runtime Error:\n\n"
                f"Return Code: {run_result.returncode}\n\n"
                f"STDOUT:\n{run_result.stdout}\n\n"
                f"STDERR:\n{run_result.stderr}"
            )

        return combine_output(run_result)

    except subprocess.TimeoutExpired:

        return "Execution stopped: Program took too long."

    except Exception as e:

        return (
            "Java execution error: "
            f"{type(e).__name__}: {str(e)}"
        )

    finally:

        if temp_dir and os.path.exists(temp_dir):

            shutil.rmtree(
                temp_dir,
                ignore_errors=True
            )